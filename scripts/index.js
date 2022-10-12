// * get a MediaStream with video but no audio (only camera)
navigator.mediaDevices
    .getUserMedia({
        audio: false,
        video: {
            width: fontSize * resolution[0],
            height: fontSize * widthFactor * resolution[1],
        },
    })
    .then((stream) => {
        // start video when user clicks the start button
        startBtnElement.addEventListener("click", () => switcher(stream));
    })
    // TODO: display message if user does not have camera/error with opening track
    .catch((err) => console.log(err));

// * switches between using ImageCapture and video, depending on the user's browser
/*
 ! WARNING: I have found the ImageCapture API to be much buggier than the video DOM reference;
 ! this may be an implementation issue, but in any case, I have disabled using the former and am using
 ! the latter instead.
 */
const switcher = (stream) => {
    // hide/show extra stuff
    fpsElement.style.display = "block";
    settingsBtnElement.style.display = "block";
    pauseBtnElement.style.display = "block";
    navPanelElement.style.display = "block";
    nocamElement.style.display = "none";
    startBtnElement.style.display = "none";
    playing = true;

    // use ImageCapture API if available
    // condition was previously ("ImageCapture" in window)
    if (false) {
        captureCamera(stream);
    }
    // otherwise use built-in HTML5 video API
    else {
        videoElement.srcObject = stream;
        videoElement.play().then(() => {
            videoCamera(videoElement);
        });
    }
};

// * uses the ImageCapture API to render the camera live
// ! WARNING: see note on line 14
const captureCamera = (stream) => {
    // create an ImageCapture object for grabbing frames from the camera
    let capture = new ImageCapture(stream.getVideoTracks()[0]);
    let time = 0;

    // set an interval, running at "fps" frames per second
    const interval = setInterval(() => {
        // if the user hasn't paused, and the ImageCapture is ready
        if (
            playing &&
            capture.track.readyState === "live" &&
            capture.track.enabled
        ) {
            // grab a frame and convert it to ASCII
            capture
                .grabFrame()
                .then((frame) => {
                    screenElement.innerHTML = getAscii(frame);
                })
                // TODO: reset MediaStream on error
                .catch((err) => {
                    if (err === undefined) return;
                    console.error(err);
                    errorElement.style.display = "block";
                });

            // update FPS
            fpsElement.textContent =
                "fps: " + Math.round((1 / (performance.now() - time)) * 1000);
            time = performance.now();
        }

        // stop everything if not running
        // TODO: implement a stop button
        if (!running) {
            stream.getVideoTracks()[0].stop();
            closeInterval(interval);
            return;
        }
    }, 1000 / fps);
};

// * uses the built-in HTML5 video DOM reference to render the camera live
const videoCamera = (video) => {
    // variable for measuring time elapsed since the last frame
    let time = 0;

    // set an interval, running at "fps" frames per second
    const interval = setInterval(() => {
        // if the user hasn't paused
        if (playing) {
            // get
            screenElement.innerHTML = getAscii(
                video,
                video.videoWidth,
                video.videoHeight * widthFactor
            );

            fpsElement.textContent =
                "fps: " + Math.round((1 / (performance.now() - time)) * 1000);
            time = performance.now();
        }

        if (!running) {
            clearInterval(interval);
            return;
        }

        if (!video.paused && !playing) video.pause();
        else if (video.paused && playing) video.play();
    }, 1000 / fps);
};

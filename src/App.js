// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

import React, { useRef } from "react";
import "./App.css";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities";

function App() {
  const angle = useRef();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  //  Load posenet
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    //
    setInterval(() => {
      detect(net);
    }, 100);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Make Detections
      const pose = await net.estimateSinglePose(video);
      // console.log(pose);

      const { keypoints } = pose;
      const rightLegParts = keypoints
        .filter((keypoint) => keypoint.part.includes("right"))
        .filter(
          (keypoint) =>
            !keypoint.part.includes("Eye") &&
            !keypoint.part.includes("Ear") &&
            !keypoint.part.includes("Shoulder") &&
            !keypoint.part.includes("Elbow") &&
            !keypoint.part.includes("Wrist")
        );

      // console.log({ rightLegParts });

      const rightLegIsVisible = rightLegParts.every((bodyPart) => {
        return bodyPart.score > 0.7;
      });
      if (rightLegIsVisible) {
        const [rightHip, rightKnee, rightAnkle] = rightLegParts;
        console.log({ rightHip, rightKnee, rightAnkle });
        const { x: rightHipX, y: rightHipY } = rightHip.position;
        const { x: rightKneeX, y: rightKneeY } = rightKnee.position;
        const { x: rightAnkleX, y: rightAnkleY } = rightAnkle.position;

        const hipToKnee = Math.sqrt(
          Math.pow(rightHipX - rightKneeX, 2) +
            Math.pow(rightHipY - rightKneeY, 2)
        );

        const kneeToAnkle = Math.sqrt(
          Math.pow(rightKneeX - rightAnkleX, 2) +
            Math.pow(rightKneeY - rightAnkleY, 2)
        );

        const ankleToHip = Math.sqrt(
          Math.pow(rightAnkleX - rightHipX, 2) +
            Math.pow(rightAnkleY - rightHipY, 2)
        );

        // console.log({ hipToKnee, kneeToAnkle, ankleToHip });
        const cosOfHipKneeAnkleAngle =
          (Math.pow(hipToKnee, 2) +
            Math.pow(kneeToAnkle, 2) -
            Math.pow(ankleToHip, 2)) /
          (2 * hipToKnee * kneeToAnkle);

        const hipKneeAnkleAngle = radiansToDegrees(
          Math.acos(cosOfHipKneeAnkleAngle)
        );

        // console.log({ cosOfHipKneeAnkleAngle, hipKneeAnkleAngle });
        angle.current = hipKneeAnkleAngle;
      } else {
        angle.current = undefined;
      }

      drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
    }
  };

  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    // todo -> add the angle value
    if (typeof angle.current === "number") {
      ctx.beginPath();
      ctx.font = "80px serif";
      const isAngleValid = angle.current >= 140 && angle.current <= 156;
      const seatTooHigh = angle.current > 157;

      const angleColor = isAngleValid ? "green" : "red";
      ctx.fillStyle = angleColor;
      ctx.fillText(
        isAngleValid
          ? "Идеално"
          : seatTooHigh
          ? "Свалете седалката"
          : "Вдигнете седалката",
        50,
        90
      );
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.font = "80px serif";
      ctx.fillStyle = "red";
      ctx.fillText("Дясния крак не е в обхват", 0, 90, 630);
      ctx.fill();
    }
    // todo end
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };

  runPosenet();

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

export default App;

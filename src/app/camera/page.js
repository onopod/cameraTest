"use client"

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";

export default function Home() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    useEffect(() => {
        const initializeCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    videoRef.current.addEventListener("loadedmetadata", () => {
                        videoRef.current
                            .play()
                            .then(() => {
                                console.log("Video playback started.");
                                initializeCanvasAndVideo();
                            })
                            .catch((error) => console.error("Failed to play video:", error));
                    });
                }
            } catch (error) {
                console.error("Failed to initialize camera:", error);
            }
        };

        const initializeCanvasAndVideo = () => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                console.log("Canvas initialized with size:", canvas.width, canvas.height);
            }
        };

        const detectObjects = async () => {
            const model = await cocoSsd.load();
            setIsModelLoaded(true);

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            const detect = async () => {
                try {
                    const predictions = await model.detect(video);
                    console.log("Predictions:", predictions);

                    // Canvas の描画をクリア
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Video を Canvas に描画
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // 検出結果を描画
                    predictions.forEach((prediction) => {
                        const [x, y, width, height] = prediction.bbox;
                        ctx.strokeStyle = "green";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, width, height);
                        ctx.font = "18px Arial";
                        ctx.fillStyle = "green";
                        ctx.fillText(
                            `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
                            x,
                            y > 10 ? y - 5 : 10
                        );
                    });

                    requestAnimationFrame(detect); // 次のフレームを検出
                } catch (error) {
                    console.error("Error during detection:", error);
                }
            };

            video.addEventListener("loadeddata", () => {
                detect();
            });
        };

        initializeCamera();
        detectObjects();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div>
            <h1>リアルタイム物体検知</h1>
            {!isModelLoaded ? (
                <p>モデルを読み込んでいます...</p>
            ) : (
                <p>モデルが読み込まれました！</p>
            )}
            <div style={{ position: "relative" }}>
                <video
                    ref={videoRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    );
}

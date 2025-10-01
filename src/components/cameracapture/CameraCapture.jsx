import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CameraCapture.css";

export default function CameraCapture() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [photo, setPhoto] = useState(null);
    const navigate = useNavigate();

        // Démarrer la caméra
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("getUserMedia non supporté dans ce navigateur");
                }
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
                setStream(mediaStream);
            } catch (err) {
                console.error("Erreur accès caméra :", err);
                alert("Impossible d'accéder à la caméra. Vérifiez les permissions et réessayez.");
            }
        };

        // Attacher le flux quand la <video> est montée et que le stream existe
        useEffect(() => {
            const vid = videoRef.current;
            if (!vid || !stream) return;
            vid.srcObject = stream;
            const onLoaded = () => {
                // Certaines plateformes requièrent un play() explicite
                vid.play().catch(() => {});
            };
            vid.addEventListener("loadedmetadata", onLoaded);
            return () => vid.removeEventListener("loadedmetadata", onLoaded);
        }, [stream]);

        // Nettoyer les tracks à la destruction du composant
        useEffect(() => {
            return () => {
                stream?.getTracks().forEach(t => t.stop());
            };
        }, [stream]);


    // Capturer une photo
    const takePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        // Adapter le canvas à la taille réelle du flux
        const w = video.videoWidth || 320;
        const h = video.videoHeight || 240;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, w, h);
        const photoData = canvas.toDataURL("image/png");
        setPhoto(photoData);

        // arrêter la caméra après capture
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    // Confirmer et passer à la page suivante
    const confirmPhoto = () => {
        navigate("/confirm-photo", { state: { photo } });
    };

    // Démarrer automatiquement quand on arrive sur la page
    useEffect(() => { startCamera(); /* auto */ }, []);

        return (
                <div className="camera-screen">
                    {/* live frame */}
                    {!photo && (
                        <div className="camera-frame">
                            {stream ? (
                                <video
                                    ref={videoRef}
                                    className="camera-video"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                            ) : (
                                <div className="camera-preview-img" />
                            )}
                        </div>
                    )}

                    {/* shutter controls */}
                    {!photo && (
                        <div className="camera-controls">
                            <button className="shutter-button" onClick={takePhoto} aria-label="Prendre une photo" />
                        </div>
                    )}

                    {/* preview */}
                    {photo && (
                        <div className="preview-overlay">
                            <img src={photo} alt="Prévisualisation" className="camera-preview-img" />
                            <div className="preview-actions">
                                <button className="confirm-btn" onClick={confirmPhoto}>Confirmer</button>
                                <button className="retry-btn" onClick={() => setPhoto(null)}>Reprendre</button>
                            </div>
                        </div>
                    )}

                    {/* hidden canvas */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
        );
}

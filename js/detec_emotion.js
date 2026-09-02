import { HolographicTears } from './holographic_tears.js';
import { AngryEffects } from './angry_effects.js';

export class EmotionController {

    constructor() {

        // =====================================================
        // ESTADO GERAL
        // =====================================================

        this.onEmotionChange = null;

        this.active = false;

        this.video = null;

        this.canvases = {};


        // =====================================================
        // FACE API
        // =====================================================

        this._faceBox = null;

        this._smoothFaceBox = null;

        this._faceSmoothing = 0.75;

        this._landmarks = null;

        this.showLandmarks = false;


        // =====================================================
        // SISTEMA DE LÁGRIMAS
        // =====================================================

        this._tears =
            new HolographicTears();


        // =====================================================
        // SISTEMA VISUAL DO ANGRY
        // =====================================================

        this._angry =
            new AngryEffects();


        // =====================================================
        // MODO CARROSSEL
        // =====================================================

        this.carouselMode = false;


        // =====================================================
        // CONTROLE DE DETECÇÃO
        // =====================================================

        this._detectingFace = false;

        this._lastFaceDetectionTime = 0;

        this._faceDetectionInterval = 80;

        this._faceOptions = null;


        // =====================================================
        // ENQUADRAMENTO ESTÁVEL DA CABEÇA
        // =====================================================

        this._headFrame = null;

        this._headFrameInitialized = false;

        this._headFrameWidthFactor = 2.8;

        this._headFrameHeightFactor = 3.4;

        this._headFrameVerticalPosition = 0.56;

        this._headFrameSmoothing = 0.92;


        // =====================================================
        // ESTABILIZAÇÃO TEMPORAL DAS EMOÇÕES
        // =====================================================

        this._lastEmotion = null;

        this._candidateEmotion = null;

        this._candidateEmotionCount = 0;

        this._emotionHistory = [];

        this._emotionHistorySize = 8;

        this._emotionMinConfidence = 0.35;

        this._emotionRequiredFrames = 4;


        // =====================================================
        // TEMPO MÍNIMO DE PERMANÊNCIA
        // =====================================================

        this._emotionMinimumDuration = 5000;


        // =====================================================
        // TEMPO DE TRANSIÇÃO
        // =====================================================

        this._emotionTransitionDuration = 700;

        this._emotionStartTime = 0;

        this._candidateStartTime = 0;


        // =====================================================
        // MEDIAPIPE
        // =====================================================

        this._segmentation = null;

        this._segmentationMask = null;

        this._segmentationImage = null;

        this._lastValidMask = null;

        this._lastMaskTime = 0;

        this._segmentationReady = false;

        this._sendingFrame = false;


        // =====================================================
        // CANVAS DA MÁSCARA
        // =====================================================

        this._maskCanvas =
            document.createElement('canvas');

        this._maskCtx =
            this._maskCanvas.getContext('2d');


        // =====================================================
        // CANVAS DA PESSOA
        // =====================================================

        this._personCanvas =
            document.createElement('canvas');

        this._personCtx =
            this._personCanvas.getContext('2d');


        // =====================================================
        // LOOP VISUAL
        // =====================================================

        this._renderLoop();
    }


    // =========================================================
    // INICIALIZA MEDIAPIPE
    // =========================================================

    async _initSegmentation() {

        if (this._segmentation) {
            return;
        }


        if (
            typeof SelfieSegmentation ===
            'undefined'
        ) {

            throw new Error(
                'SelfieSegmentation não foi carregado. ' +
                'Verifique o index.html.'
            );
        }


        console.log(
            'Inicializando MediaPipe Selfie Segmentation...'
        );


        this._segmentation =
            new SelfieSegmentation({

                locateFile: (file) => {

                    return (
                        'https://cdn.jsdelivr.net/npm/' +
                        '@mediapipe/selfie_segmentation@0.1/' +
                        file
                    );
                }

            });


        this._segmentation.setOptions({

            modelSelection: 1

        });


        this._segmentation.onResults(
            (results) => {

                if (
                    !results ||
                    !results.segmentationMask
                ) {

                    return;
                }


                this._segmentationMask =
                    results.segmentationMask;


                this._segmentationImage =
                    results.image;


                this._lastValidMask =
                    results.segmentationMask;


                this._lastMaskTime =
                    performance.now();


                this._segmentationReady =
                    true;
            }
        );


        console.log(
            'MediaPipe Selfie Segmentation inicializado.'
        );
    }


    // =========================================================
    // INICIA DETECÇÃO
    // =========================================================

    async startDetection(
        stream,
        existingVideo = null
    ) {

        if (this.active) {

            console.warn(
                'Detecção já estava ativa.'
            );

            return;
        }


        // =====================================================
        // USA VÍDEO EXISTENTE
        // =====================================================

        if (existingVideo) {

            this.video =
                existingVideo;

        } else {

            this.video =
                document.createElement('video');


            this.video.srcObject =
                stream;


            this.video.muted =
                true;


            this.video.autoplay =
                true;


            this.video.playsInline =
                true;


            await this.video.play();
        }


        // =====================================================
        // ESPERA CÂMERA
        // =====================================================

        await this._waitForVideo();


        const width =
            this.video.videoWidth;


        const height =
            this.video.videoHeight;


        console.log(
            `Câmera pronta: ${width}x${height}`
        );


        // =====================================================
        // CONFIGURA CANVAS
        // =====================================================

        this._maskCanvas.width =
            width;

        this._maskCanvas.height =
            height;

        this._personCanvas.width =
            width;

        this._personCanvas.height =
            height;


        // =====================================================
        // VERIFICA FACE API
        // =====================================================

        if (
            typeof faceapi ===
            'undefined'
        ) {

            throw new Error(
                'face-api.js não foi carregado.'
            );
        }


        // =====================================================
        // DETECTOR FACIAL
        // =====================================================

        this._faceOptions =
            new faceapi.TinyFaceDetectorOptions({

                inputSize: 320,

                scoreThreshold: 0.4

            });


        // =====================================================
        // MEDIAPIPE
        // =====================================================

        await this._initSegmentation();


        // =====================================================
        // LIMPA ESTADOS
        // =====================================================

        this._segmentationMask =
            null;

        this._segmentationImage =
            null;

        this._lastValidMask =
            null;

        this._segmentationReady =
            false;

        this._smoothFaceBox =
            null;

        this._faceBox =
            null;

        this._landmarks =
            null;

        this._headFrame =
            null;

        this._headFrameInitialized =
            false;


        // =====================================================
        // RESET EMOÇÕES
        // =====================================================

        this._emotionHistory =
            [];

        this._lastEmotion =
            null;

        this._candidateEmotion =
            null;

        this._candidateEmotionCount =
            0;

        this._emotionStartTime =
            0;

        this._candidateStartTime =
            0;

        this._lastFaceDetectionTime =
            0;


        // =====================================================
        // ATIVA
        // =====================================================

        this.active =
            true;


        console.log(
            'EmotionController ativo.'
        );


        // =====================================================
        // INICIA PROCESSAMENTOS
        // =====================================================

        this._segmentationLoop();

        this._faceLoop();
    }


    // =========================================================
    // ESPERA VÍDEO
    // =========================================================

    async _waitForVideo() {

        if (
            this.video &&
            this.video.videoWidth > 0 &&
            this.video.videoHeight > 0
        ) {

            return;
        }


        await new Promise(
            (resolve) => {

                const check =
                    () => {

                        if (!this.video) {

                            requestAnimationFrame(
                                check
                            );

                            return;
                        }


                        if (
                            this.video.videoWidth > 0 &&
                            this.video.videoHeight > 0
                        ) {

                            resolve();

                            return;
                        }


                        requestAnimationFrame(
                            check
                        );
                    };


                check();
            }
        );
    }


    // =========================================================
    // LOOP MEDIAPIPE
    // =========================================================

    async _segmentationLoop() {

        if (!this.active) {
            return;
        }


        if (
            this.video &&
            this.video.readyState >= 2 &&
            this._segmentation &&
            !this._sendingFrame
        ) {

            this._sendingFrame =
                true;


            try {

                await this._segmentation.send({

                    image: this.video

                });

            } catch (error) {

                console.error(
                    'Erro no MediaPipe:',
                    error
                );

            } finally {

                this._sendingFrame =
                    false;
            }
        }


        requestAnimationFrame(
            () =>
                this._segmentationLoop()
        );
    }


    // =========================================================
    // LOOP FACE API
    // =========================================================

    _faceLoop() {

        if (!this.active) {
            return;
        }


        const now =
            performance.now();


        if (
            now -
            this._lastFaceDetectionTime
            >=
            this._faceDetectionInterval
        ) {

            this._lastFaceDetectionTime =
                now;


            this._detectFace();
        }


        requestAnimationFrame(
            () =>
                this._faceLoop()
        );
    }


    // =========================================================
    // DETECÇÃO FACIAL
    // =========================================================

    async _detectFace() {

        if (
            !this.video ||
            !this.active ||
            this._detectingFace
        ) {

            return;
        }


        if (
            this.video.readyState < 2
        ) {

            return;
        }


        this._detectingFace =
            true;


        try {

            let detection =
                null;


            detection =
                await faceapi
                    .detectSingleFace(
                        this.video,
                        this._faceOptions
                    )
                    .withFaceLandmarks(true)
                    .withFaceExpressions();


            this._landmarks =
                detection?.landmarks ||
                null;


            if (detection) {

                const newBox =
                    detection.detection.box;


                // =============================================
                // PRIMEIRA DETECÇÃO
                // =============================================

                if (
                    !this._smoothFaceBox
                ) {

                    this._smoothFaceBox = {

                        x: newBox.x,

                        y: newBox.y,

                        width: newBox.width,

                        height: newBox.height

                    };

                }


                // =============================================
                // SUAVIZA
                // =============================================

                else {

                    const s =
                        this._faceSmoothing;


                    this._smoothFaceBox.x =
                        this._smoothFaceBox.x * s +
                        newBox.x * (1 - s);


                    this._smoothFaceBox.y =
                        this._smoothFaceBox.y * s +
                        newBox.y * (1 - s);


                    this._smoothFaceBox.width =
                        this._smoothFaceBox.width * s +
                        newBox.width * (1 - s);


                    this._smoothFaceBox.height =
                        this._smoothFaceBox.height * s +
                        newBox.height * (1 - s);
                }


                this._faceBox = {

                    ...this._smoothFaceBox

                };


                this._updateHeadFrame();


                if (
                    detection.expressions
                ) {

                    this._processEmotion(
                        detection.expressions
                    );
                }
            }

        } catch (error) {

            console.error(
                'Erro face-api:',
                error
            );

        } finally {

            this._detectingFace =
                false;
        }
    }


    // =========================================================
    // ATUALIZA ENQUADRAMENTO
    // =========================================================

    _updateHeadFrame() {

        if (
            !this._faceBox ||
            !this.video
        ) {

            return;
        }


        const videoW =
            this.video.videoWidth;


        const videoH =
            this.video.videoHeight;


        if (
            !videoW ||
            !videoH
        ) {

            return;
        }


        const face =
            this._faceBox;


        // =====================================================
        // PRIMEIRA DETECÇÃO
        // =====================================================

        if (
            !this._headFrameInitialized
        ) {

            const frameWidth =
                face.width *
                this._headFrameWidthFactor;


            const frameHeight =
                face.height *
                this._headFrameHeightFactor;


            const centerX =
                face.x +
                face.width / 2;


            const centerY =
                face.y +
                face.height * 0.45;


            this._headFrame = {

                x:
                    centerX -
                    frameWidth / 2,

                y:
                    centerY -
                    frameHeight *
                    this._headFrameVerticalPosition,

                width:
                    frameWidth,

                height:
                    frameHeight

            };


            this._headFrameInitialized =
                true;


            this._clampHeadFrame();


            return;
        }


        // =====================================================
        // ENQUADRAMENTO EXISTENTE
        // =====================================================

        const frame =
            this._headFrame;


        const centerX =
            face.x +
            face.width / 2;


        const centerY =
            face.y +
            face.height * 0.45;


        const targetX =
            centerX -
            frame.width / 2;


        const targetY =
            centerY -
            frame.height *
            this._headFrameVerticalPosition;


        const s =
            this._headFrameSmoothing;


        frame.x =
            frame.x * s +
            targetX * (1 - s);


        frame.y =
            frame.y * s +
            targetY * (1 - s);


        this._clampHeadFrame();
    }


    // =========================================================
    // LIMITA ENQUADRAMENTO
    // =========================================================

    _clampHeadFrame() {

        if (
            !this._headFrame ||
            !this.video
        ) {

            return;
        }


        const videoW =
            this.video.videoWidth;


        const videoH =
            this.video.videoHeight;


        const frame =
            this._headFrame;


        if (
            frame.width >= videoW
        ) {

            frame.x =
                0;

            frame.width =
                videoW;

        } else {

            frame.x =
                Math.max(
                    0,
                    Math.min(
                        frame.x,
                        videoW -
                        frame.width
                    )
                );
        }


        if (
            frame.height >= videoH
        ) {

            frame.y =
                0;

            frame.height =
                videoH;

        } else {

            frame.y =
                Math.max(
                    0,
                    Math.min(
                        frame.y,
                        videoH -
                        frame.height
                    )
                );
        }
    }


    // =========================================================
    // PROCESSA EMOÇÃO
    // =========================================================

    _processEmotion(expressions) {

        if (!expressions) {
            return;
        }


        let detectedEmotion =
            'neutral';


        let detectedConfidence =
            0;


        for (
            const [name, value]
            of Object.entries(expressions)
        ) {

            if (
                value >
                detectedConfidence
            ) {

                detectedConfidence =
                    value;

                detectedEmotion =
                    name;
            }
        }


        // =====================================================
        // CONFIANÇA MÍNIMA
        // =====================================================

        if (
            detectedConfidence <
            this._emotionMinConfidence
        ) {

            return;
        }


        const now =
            performance.now();


        // =====================================================
        // HISTÓRICO
        // =====================================================

        this._emotionHistory.push({

            emotion:
                detectedEmotion,

            confidence:
                detectedConfidence,

            time:
                now

        });


        if (
            this._emotionHistory.length >
            this._emotionHistorySize
        ) {

            this._emotionHistory.shift();
        }


        // =====================================================
        // EMOÇÃO DOMINANTE
        // =====================================================

        const counts =
            {};


        for (
            const item
            of this._emotionHistory
        ) {

            counts[item.emotion] =
                (counts[item.emotion] || 0) +
                1;
        }


        let dominantEmotion =
            detectedEmotion;


        let dominantCount =
            0;


        for (
            const [emotion, count]
            of Object.entries(counts)
        ) {

            if (
                count >
                dominantCount
            ) {

                dominantEmotion =
                    emotion;

                dominantCount =
                    count;
            }
        }


        // =====================================================
        // CONFIANÇA MÉDIA
        // =====================================================

        let confidenceSum =
            0;


        let confidenceCount =
            0;


        for (
            const item
            of this._emotionHistory
        ) {

            if (
                item.emotion ===
                dominantEmotion
            ) {

                confidenceSum +=
                    item.confidence;

                confidenceCount++;
            }
        }


        const averageConfidence =
            confidenceCount > 0
                ? confidenceSum /
                  confidenceCount
                : detectedConfidence;


        // =====================================================
        // PRIMEIRA EMOÇÃO
        // =====================================================

        if (
            this._lastEmotion === null
        ) {

            if (
                this._candidateEmotion !==
                dominantEmotion
            ) {

                this._candidateEmotion =
                    dominantEmotion;

                this._candidateEmotionCount =
                    1;

                this._candidateStartTime =
                    now;

                return;
            }


            this._candidateEmotionCount++;


            const candidateDuration =
                now -
                this._candidateStartTime;


            if (
                this._candidateEmotionCount >=
                    this._emotionRequiredFrames &&
                candidateDuration >=
                    this._emotionTransitionDuration
            ) {

                this._confirmEmotion(
                    dominantEmotion,
                    averageConfidence,
                    now
                );
            }


            return;
        }


        // =====================================================
        // MESMA EMOÇÃO
        // =====================================================

        if (
            dominantEmotion ===
            this._lastEmotion
        ) {

            this._candidateEmotion =
                null;

            this._candidateEmotionCount =
                0;

            this._candidateStartTime =
                0;

            return;
        }


        // =====================================================
        // NOVA EMOÇÃO
        // =====================================================

        if (
            this._candidateEmotion !==
            dominantEmotion
        ) {

            this._candidateEmotion =
                dominantEmotion;

            this._candidateEmotionCount =
                1;

            this._candidateStartTime =
                now;

            return;
        }


        // =====================================================
        // CANDIDATA CONTINUA
        // =====================================================

        this._candidateEmotionCount++;


        const candidateDuration =
            now -
            this._candidateStartTime;


        // =====================================================
        // PROTEÇÃO DA EMOÇÃO ATUAL
        // =====================================================

        const currentEmotionDuration =
            now -
            this._emotionStartTime;


        if (
            currentEmotionDuration <
            this._emotionMinimumDuration
        ) {

            return;
        }


        // =====================================================
        // TEMPO DE TRANSIÇÃO
        // =====================================================

        if (
            candidateDuration <
            this._emotionTransitionDuration
        ) {

            return;
        }


        // =====================================================
        // FRAMES SUFICIENTES
        // =====================================================

        if (
            this._candidateEmotionCount <
            this._emotionRequiredFrames
        ) {

            return;
        }


        // =====================================================
        // CONFIRMA
        // =====================================================

        this._confirmEmotion(
            dominantEmotion,
            averageConfidence,
            now
        );
    }


    // =========================================================
    // CONFIRMA EMOÇÃO
    // =========================================================

    _confirmEmotion(
        emotion,
        confidence,
        now
    ) {

        this._lastEmotion =
            emotion;


        this._emotionStartTime =
            now;


        this._candidateEmotion =
            null;


        this._candidateEmotionCount =
            0;


        this._candidateStartTime =
            0;


        console.log(
            'Emoção estabilizada:',
            emotion,
            'confiança:',
            confidence.toFixed(2)
        );


        // =====================================================
        // LÁGRIMAS
        // =====================================================

        if (
            this._tears
        ) {

            this._tears.setEmotion(
                emotion,
                confidence
            );
        }


        // =====================================================
        // ANGRY
        // =====================================================

        if (
            this._angry
        ) {

            this._angry.setEmotion(
                emotion,
                confidence
            );
        }


        // =====================================================
        // SISTEMA PRINCIPAL
        // =====================================================

        if (
            this.onEmotionChange
        ) {

            this.onEmotionChange(

                emotion,

                confidence

            );
        }
    }


    // =========================================================
    // LOOP VISUAL
    // =========================================================

    _renderLoop() {

        // =====================================================
        // ATUALIZA ANGRY
        // =====================================================

        if (
            this._angry
        ) {

            const now =
                performance.now();


            if (
                !this._angry._lastUpdateTime
            ) {

                this._angry._lastUpdateTime =
                    now;
            }


            const delta =
                now -
                this._angry._lastUpdateTime;


            this._angry._lastUpdateTime =
                now;


            this._angry.update(
                delta
            );
        }


        // =====================================================
        // DESENHA
        // =====================================================

        this._drawAll();


        requestAnimationFrame(
            () =>
                this._renderLoop()
        );
    }


    // =========================================================
    // REGISTRA CANVAS
    // =========================================================

    registerCanvas(
        id,
        canvas,
        videoEl
    ) {

        if (!canvas) {
            return;
        }


        const ctx =
            canvas.getContext('2d');


        if (!ctx) {
            return;
        }


        this.canvases[id] = {

            canvas,

            videoEl,

            ctx

        };
    }


    // =========================================================
    // DESENHA TODOS OS CANVASES
    // =========================================================

    _drawAll() {

        if (!this.video) {
            return;
        }


        if (
            this.video.readyState < 2 ||
            !this.video.videoWidth
        ) {

            return;
        }


        for (
            const item
            of Object.values(
                this.canvases
            )
        ) {

            const {
                canvas,
                ctx
            } = item;


            if (
                !canvas ||
                !ctx
            ) {

                continue;
            }


            const w =
                canvas.width;


            const h =
                canvas.height;


            if (
                w <= 0 ||
                h <= 0
            ) {

                continue;
            }


            // =================================================
            // FUNDO PRETO
            // =================================================

            ctx.save();


            ctx.globalCompositeOperation =
                'source-over';


            ctx.fillStyle =
                '#000000';


            ctx.fillRect(
                0,
                0,
                w,
                h
            );


            // =================================================
            // AGUARDA MÁSCARA
            // =================================================

            if (
                !this._segmentationReady
            ) {

                ctx.restore();

                continue;
            }


            const mask =
                this._segmentationMask ||
                this._lastValidMask;


            if (!mask) {

                ctx.restore();

                continue;
            }


            // =================================================
            // CABEÇA SEGMENTADA
            // =================================================

            this._drawHeadSegmented(

                ctx,

                w,

                h,

                mask

            );


            ctx.restore();
        }
    }


    // =========================================================
    // DESENHA SOMENTE A CABEÇA SEGMENTADA
    // =========================================================

    _drawHeadSegmented(
        ctx,
        outputW,
        outputH,
        segmentationMask
    ) {

        const videoW =
            this.video.videoWidth;


        const videoH =
            this.video.videoHeight;


        if (
            !videoW ||
            !videoH
        ) {

            return;
        }


        // =====================================================
        // AGUARDA FACE
        // =====================================================

        if (
            !this._faceBox ||
            !this._headFrame
        ) {

            return;
        }


        const frame =
            this._headFrame;


        if (
            frame.width <= 0 ||
            frame.height <= 0
        ) {

            return;
        }


        // =====================================================
        // COPIA MÁSCARA
        // =====================================================

        const maskCtx =
            this._maskCtx;


        maskCtx.clearRect(
            0,
            0,
            videoW,
            videoH
        );


        maskCtx.globalCompositeOperation =
            'source-over';


        maskCtx.drawImage(

            segmentationMask,

            0,
            0,
            videoW,
            videoH

        );


        // =====================================================
        // COPIA CÂMERA
        // =====================================================

        const personCtx =
            this._personCtx;


        personCtx.clearRect(
            0,
            0,
            videoW,
            videoH
        );


        personCtx.globalCompositeOperation =
            'source-over';


        personCtx.drawImage(

            this.video,

            0,
            0,
            videoW,
            videoH

        );


        // =====================================================
        // APLICA SEGMENTAÇÃO
        // =====================================================

        personCtx.globalCompositeOperation =
            'destination-in';


        personCtx.drawImage(

            this._maskCanvas,

            0,
            0

        );


        // =====================================================
        // LIMITA À JANELA DA CABEÇA
        // =====================================================

        personCtx.globalCompositeOperation =
            'destination-in';


        personCtx.fillStyle =
            '#ffffff';


        personCtx.fillRect(

            frame.x,

            frame.y,

            frame.width,

            frame.height

        );


        // =====================================================
        // MANTÉM PROPORÇÃO
        // =====================================================

        const sourceAspect =
            frame.width /
            frame.height;


        const outputAspect =
            outputW /
            outputH;


        let drawWidth =
            outputW;


        let drawHeight =
            outputH;


        let drawX =
            0;


        let drawY =
            0;


        if (
            sourceAspect >
            outputAspect
        ) {

            drawHeight =
                outputH;


            drawWidth =
                outputH *
                sourceAspect;


            drawX =
                (
                    outputW -
                    drawWidth
                ) / 2;

        } else {

            drawWidth =
                outputW;


            drawHeight =
                outputW /
                sourceAspect;


            drawY =
                (
                    outputH -
                    drawHeight
                ) / 2;
        }


        // =====================================================
        // ESCALA
        // =====================================================

        const scaleX =
            drawWidth /
            frame.width;


        const scaleY =
            drawHeight /
            frame.height;


        // =====================================================
        // DESENHA PESSOA
        // =====================================================

        ctx.drawImage(

            this._personCanvas,

            frame.x,
            frame.y,
            frame.width,
            frame.height,

            drawX,
            drawY,
            drawWidth,
            drawHeight

        );


        // =====================================================
        // LÁGRIMAS
        // =====================================================

        if (
            this._landmarks &&
            this._tears
        ) {

            this._tears.draw(

                ctx,

                this._landmarks.positions,

                {

                    frameX:
                        frame.x,

                    frameY:
                        frame.y,

                    drawX:
                        drawX,

                    drawY:
                        drawY,

                    scaleX:
                        scaleX,

                    scaleY:
                        scaleY,

                    scale:
                        (
                            scaleX +
                            scaleY
                        ) / 2

                }

            );
        }


        // =====================================================
        // EFEITOS DO ANGRY
        //
        // IMPORTANTE:
        //
        // Aqui usamos somente o método draw()
        // que realmente existe no AngryEffects.
        //
        // Não existe drawGlitchedPerson().
        // =====================================================

        if (
            this._angry
        ) {

            this._angry.draw(

                ctx,

                {

                    drawX:
                        drawX,

                    drawY:
                        drawY,

                    drawWidth:
                        drawWidth,

                    drawHeight:
                        drawHeight,

                    frameX:
                        frame.x,

                    frameY:
                        frame.y,

                    scaleX:
                        scaleX,

                    scaleY:
                        scaleY,

                    landmarks:
                        this._landmarks

                }

            );
        }
    }


    // =========================================================
    // CONTROLES
    // =========================================================

    setLandmarksVisible(
        visible
    ) {

        this.showLandmarks =
            Boolean(visible);
    }


    setCarouselMode(
        enabled
    ) {

        this.carouselMode =
            Boolean(enabled);
    }


    // =========================================================
    // PARA DETECÇÃO
    // =========================================================

    stop() {

        this.active =
            false;


        this._sendingFrame =
            false;


        this._detectingFace =
            false;


        this._segmentationMask =
            null;


        this._lastValidMask =
            null;


        this._segmentationReady =
            false;


        this._faceBox =
            null;


        this._smoothFaceBox =
            null;


        this._landmarks =
            null;


        this._headFrame =
            null;


        this._headFrameInitialized =
            false;


        // =====================================================
        // RESET EMOÇÕES
        // =====================================================

        this._emotionHistory =
            [];


        this._lastEmotion =
            null;


        this._candidateEmotion =
            null;


        this._candidateEmotionCount =
            0;


        this._emotionStartTime =
            0;


        this._candidateStartTime =
            0;


        console.log(
            'EmotionController parado.'
        );
    }
}

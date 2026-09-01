import {
    HolographicTears
} from './holographic_tears.js';


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
        // LÁGRIMAS
        // =====================================================

        this._tears =
            new HolographicTears();


        // =====================================================
        // CARROSSEL
        // =====================================================

        this.carouselMode = false;


        // =====================================================
        // DETECÇÃO FACIAL
        // =====================================================

        this._detectingFace = false;

        this._lastFaceDetectionTime = 0;

        this._faceDetectionInterval = 80;

        this._faceOptions = null;


        // =====================================================
        // ENQUADRAMENTO
        // =====================================================

        this._headFrame = null;

        this._headFrameInitialized = false;

        this._headFrameWidthFactor = 2.8;

        this._headFrameHeightFactor = 3.4;

        this._headFrameVerticalPosition = 0.56;

        this._headFrameSmoothing = 0.92;


        // =====================================================
        // EMOÇÕES
        // =====================================================

        this._lastEmotion = null;

        this._candidateEmotion = null;

        this._candidateEmotionCount = 0;

        this._emotionHistory = [];

        this._emotionHistorySize = 6;

        this._emotionMinConfidence = 0.35;

        this._emotionRequiredFrames = 3;


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
        // DEBUG
        // =====================================================

        this._lastFaceDebugTime = 0;

        this._lastMediaPipeDebugTime = 0;


        // =====================================================
        // CANVAS DA MÁSCARA
        // =====================================================

        this._maskCanvas =
            document.createElement(
                'canvas'
            );


        this._maskCtx =
            this._maskCanvas.getContext(
                '2d'
            );


        // =====================================================
        // CANVAS DA PESSOA
        // =====================================================

        this._personCanvas =
            document.createElement(
                'canvas'
            );


        this._personCtx =
            this._personCanvas.getContext(
                '2d'
            );


        // =====================================================
        // LOOP VISUAL
        // =====================================================

        this._renderLoop();
    }


    // =========================================================
    // MEDIAPIPE
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


        // =====================================================
        // MODELO 0
        // =====================================================

        this._segmentation.setOptions({

            modelSelection: 0

        });


        // =====================================================
        // RESULTADO
        // =====================================================

        this._segmentation.onResults(
            (results) => {

                const now =
                    performance.now();


                // Debug limitado a aproximadamente 1x/segundo
                if (
                    now -
                    this._lastMediaPipeDebugTime
                    > 1000
                ) {

                    console.log(
                        'MEDIAPIPE:',
                        {
                            results: !!results,

                            image:
                                !!results?.image,

                            segmentationMask:
                                !!results?.segmentationMask
                        }
                    );


                    this._lastMediaPipeDebugTime =
                        now;
                }


                if (
                    !results ||
                    !results.segmentationMask
                ) {

                    return;
                }


                // =================================================
                // GUARDA RESULTADO
                // =================================================

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
        // VÍDEO EXISTENTE
        // =====================================================

        if (existingVideo) {

            this.video =
                existingVideo;

        } else {

            this.video =
                document.createElement(
                    'video'
                );


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
        // CANVASES INTERNOS
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
        // FACE API
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
        // DETECTOR
        // =====================================================

        this._faceOptions =
            new faceapi.TinyFaceDetectorOptions({

                inputSize: 320,

                scoreThreshold: 0.4

            });


        console.log(
            'TinyFaceDetector configurado:',
            this._faceOptions
        );


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

        this._lastFaceDetectionTime =
            0;


        // =====================================================
        // RESET DEBUG
        // =====================================================

        this._lastFaceDebugTime =
            0;

        this._lastMediaPipeDebugTime =
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
        // INICIA LOOPS
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
            resolve => {

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

                const now =
                    performance.now();


                if (
                    now -
                    this._lastMediaPipeDebugTime
                    > 1000
                ) {

                    console.log(
                        'MediaPipe enviando frame...'
                    );


                    this._lastMediaPipeDebugTime =
                        now;
                }


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


            // =================================================
            // FACE API
            // =================================================

            detection =
                await faceapi
                    .detectSingleFace(
                        this.video,
                        this._faceOptions
                    )
                    .withFaceLandmarks(true)
                    .withFaceExpressions();


            const now =
                performance.now();


            // =================================================
            // DEBUG FACE API
            // =================================================

            if (
                now -
                this._lastFaceDebugTime
                > 1000
            ) {

                if (detection) {

                    console.log(
                        'FACE API OK:',
                        {
                            score:
                                Number(
                                    detection.detection.score
                                ).toFixed(3),

                            expressions:
                                detection.expressions
                        }
                    );

                } else {

                    console.log(
                        'FACE API: nenhum rosto detectado'
                    );
                }


                this._lastFaceDebugTime =
                    now;
            }


            // =================================================
            // LANDMARKS
            // =================================================

            this._landmarks =
                detection?.landmarks ||
                null;


            // =================================================
            // ROSTO ENCONTRADO
            // =================================================

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


                // =============================================
                // ENQUADRAMENTO
                // =============================================

                this._updateHeadFrame();


                // =============================================
                // EXPRESSÃO
                // =============================================

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
    // ENQUADRAMENTO
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
        // FRAME EXISTENTE
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
    // LIMITA FRAME
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


        // =====================================================
        // HORIZONTAL
        // =====================================================

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


        // =====================================================
        // VERTICAL
        // =====================================================

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
    // EMOÇÃO
    // =========================================================

    _processEmotion(
        expressions
    ) {

        if (!expressions) {
            return;
        }


        let currentEmotion =
            'neutral';


        let currentConfidence =
            0;


        // =====================================================
        // MAIOR PROBABILIDADE
        // =====================================================

        for (
            const [name, value]
            of Object.entries(
                expressions
            )
        ) {

            if (
                value >
                currentConfidence
            ) {

                currentConfidence =
                    value;

                currentEmotion =
                    name;
            }
        }


        // =====================================================
        // CONFIDÊNCIA MÍNIMA
        // =====================================================

        if (
            currentConfidence <
            this._emotionMinConfidence
        ) {

            return;
        }


        // =====================================================
        // LÁGRIMAS
        // =====================================================

        if (
            this._tears &&
            typeof this._tears.setEmotion ===
            'function'
        ) {

            this._tears.setEmotion(
                currentEmotion,
                currentConfidence
            );
        }


        // =====================================================
        // HISTÓRICO
        // =====================================================

        this._emotionHistory.push({

            emotion:
                currentEmotion,

            confidence:
                currentConfidence,

            time:
                performance.now()

        });


        if (
            this._emotionHistory.length >
            this._emotionHistorySize
        ) {

            this._emotionHistory.shift();
        }


        // =====================================================
        // CONTAGEM
        // =====================================================

        const counts =
            {};


        for (
            const item
            of this._emotionHistory
        ) {

            counts[item.emotion] =
                (
                    counts[item.emotion] ||
                    0
                ) + 1;
        }


        // =====================================================
        // DOMINANTE
        // =====================================================

        let dominantEmotion =
            currentEmotion;


        let dominantCount =
            0;


        for (
            const [emotion, count]
            of Object.entries(
                counts
            )
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

                : 0;


        // =====================================================
        // CANDIDATA
        // =====================================================

        if (
            dominantEmotion ===
            this._candidateEmotion
        ) {

            this._candidateEmotionCount++;

        } else {

            this._candidateEmotion =
                dominantEmotion;


            this._candidateEmotionCount =
                1;
        }


        // =====================================================
        // ESPERA ESTABILIZAR
        // =====================================================

        if (
            this._candidateEmotionCount <
            this._emotionRequiredFrames
        ) {

            return;
        }


        // =====================================================
        // JÁ ATUAL
        // =====================================================

        if (
            dominantEmotion ===
            this._lastEmotion
        ) {

            return;
        }


        // =====================================================
        // CONFIRMA
        // =====================================================

        this._lastEmotion =
            dominantEmotion;


        console.log(
            'Emoção estabilizada:',
            dominantEmotion,
            'confiança:',
            averageConfidence.toFixed(2)
        );


        // =====================================================
        // ENVIA AO MAIN
        // =====================================================

        if (
            this.onEmotionChange
        ) {

            this.onEmotionChange(

                dominantEmotion,

                averageConfidence

            );
        }
    }


    // =========================================================
    // LOOP VISUAL
    // =========================================================

    _renderLoop() {

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
            canvas.getContext(
                '2d'
            );


        if (!ctx) {
            return;
        }


        this.canvases[id] = {

            canvas,

            videoEl,

            ctx

        };


        console.log(
            `Canvas registrado no EmotionController: ${id}`
        );
    }


    // =========================================================
    // DESENHA TUDO
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


            ctx.save();


            // =================================================
            // FUNDO
            // =================================================

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
            // FALLBACK 1:
            // AINDA NÃO TEM ROSTO
            //
            // MOSTRA A CÂMERA.
            //
            // ISSO É TEMPORÁRIO PARA GARANTIR
            // QUE A CÂMERA NÃO DESAPAREÇA.
            // =================================================

            if (
                !this._faceBox ||
                !this._headFrame
            ) {

                this._drawCameraFallback(
                    ctx,
                    w,
                    h
                );


                ctx.restore();

                continue;
            }


            // =================================================
            // FALLBACK 2:
            // TEM ROSTO, MAS MEDIAPIPE AINDA NÃO
            // =================================================

            if (
                !this._segmentationReady
            ) {

                this._drawHeadRaw(
                    ctx,
                    w,
                    h
                );


                ctx.restore();

                continue;
            }


            // =================================================
            // SEGMENTAÇÃO
            // =================================================

            const mask =
                this._segmentationMask ||
                this._lastValidMask;


            if (!mask) {

                this._drawHeadRaw(
                    ctx,
                    w,
                    h
                );


                ctx.restore();

                continue;
            }


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
    // FALLBACK DA CÂMERA
    // =========================================================

    _drawCameraFallback(
        ctx,
        outputW,
        outputH
    ) {

        if (!this.video) {
            return;
        }


        ctx.globalCompositeOperation =
            'source-over';


        ctx.drawImage(

            this.video,

            0,
            0,

            this.video.videoWidth,
            this.video.videoHeight,

            0,
            0,

            outputW,
            outputH
        );
    }


    // =========================================================
    // DESENHA CABEÇA SEM SEGMENTAÇÃO
    // =========================================================

    _drawHeadRaw(
        ctx,
        outputW,
        outputH
    ) {

        if (
            !this.video ||
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


        ctx.globalCompositeOperation =
            'source-over';


        ctx.drawImage(

            this.video,

            frame.x,
            frame.y,
            frame.width,
            frame.height,

            0,
            0,
            outputW,
            outputH
        );
    }


    // =========================================================
    // DESENHA CABEÇA SEGMENTADA
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
        // MÁSCARA
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
        // IMAGEM DA CÂMERA
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
        // APLICA MÁSCARA
        // =====================================================

        personCtx.globalCompositeOperation =
            'destination-in';


        personCtx.drawImage(

            this._maskCanvas,

            0,
            0

        );


        // =====================================================
        // LIMITA À CABEÇA
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
        // PROPORÇÃO
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
        // DESENHA
        // =====================================================

        ctx.globalCompositeOperation =
            'source-over';


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
            this._tears &&
            typeof this._tears.draw ===
            'function'
        ) {

            const scaleX =
                drawWidth /
                frame.width;


            const scaleY =
                drawHeight /
                frame.height;


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
    }


    // =========================================================
    // CONTROLES
    // =========================================================

    setLandmarksVisible(
        visible
    ) {

        this.showLandmarks =
            Boolean(
                visible
            );
    }


    setCarouselMode(
        enabled
    ) {

        this.carouselMode =
            Boolean(
                enabled
            );
    }


    // =========================================================
    // STOP
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


        this._headFrame =
            null;


        this._headFrameInitialized =
            false;


        this._emotionHistory =
            [];


        this._lastEmotion =
            null;


        this._candidateEmotion =
            null;


        this._candidateEmotionCount =
            0;


        console.log(
            'EmotionController parado.'
        );
    }
}

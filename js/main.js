```javascript
const CONFIG = {
    MODELS: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
};

const AUDIO_MAP = {
    happy:     'assets/audio/Holograma3D_Feliz.mp3',
    sad:       'assets/audio/Holograma3D_Triste.mp3',
    angry:     'assets/audio/Holograma3D_Raiva.mp3',
    disgusted: 'assets/audio/Holograma3D_Nojo.mp3',
    surprised: 'assets/audio/Holograma3D_Surpresa.mp3',
    fearful:   'assets/audio/Holograma3D_Triste.mp3',
    neutral:   'assets/audio/Holograma3D_Neutro.mp3',
    carousel:  'assets/audio/Holograma3D_Carrossel.mp3'
};

const FADE_DURATION = 1000;

const FACE_IDS = [
    'videoTop',
    'videoLeft',
    'videoRight',
    'videoBottom'
];

let hCtrl = null;
let eCtrl = null;

let carouselActive = false;
let landmarksActive = false;

let currentAudio = null;
let currentEmotion = null;

let fadeInterval = null;


// ============================================================
// INIT
// ============================================================

async function init() {

    try {

        const progress =
            document.getElementById('loadingProgress');

        console.log('Carregando modelos face-api.js...');


        // ====================================================
        // TINY FACE DETECTOR
        // ====================================================

        await faceapi.nets.tinyFaceDetector.loadFromUri(
            CONFIG.MODELS
        );

        if (progress) {
            progress.style.width = '33%';
        }

        console.log('TinyFaceDetector carregado.');


        // ====================================================
        // EXPRESSÕES
        // ====================================================

        await faceapi.nets.faceExpressionNet.loadFromUri(
            CONFIG.MODELS
        );

        if (progress) {
            progress.style.width = '66%';
        }

        console.log('FaceExpressionNet carregado.');


        // ====================================================
        // LANDMARKS
        // ====================================================

        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(
            CONFIG.MODELS
        );

        if (progress) {
            progress.style.width = '100%';
        }

        console.log('FaceLandmark68TinyNet carregado.');


        // ====================================================
        // CÂMERAS
        // ====================================================

        const devices =
            await navigator.mediaDevices.enumerateDevices();

        const videos =
            devices.filter(
                device => device.kind === 'videoinput'
            );

        const select =
            document.getElementById('cameraSelect');


        select.innerHTML =
            videos.map(
                device =>
                    `<option value="${device.deviceId}">
                        ${device.label || 'Câmera'}
                    </option>`
            ).join('');


        select.disabled = false;


        document.getElementById(
            'startBtn'
        ).disabled = false;


        document.getElementById(
            'loadingScreen'
        ).style.display = 'none';


        updateStatus(
            'Pronto para iniciar',
            'success'
        );


        console.log(
            'Inicialização concluída.'
        );


    } catch (error) {

        console.error(
            'Erro ao carregar modelos:',
            error
        );


        updateStatus(
            'Erro ao carregar modelos',
            'danger'
        );
    }
}


// ============================================================
// START
// ============================================================

async function start() {

    try {

        console.log('Iniciando câmera...');


        const id =
            document
                .getElementById('cameraSelect')
                .value;


        // ====================================================
        // CÂMERA
        // ====================================================

        const stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    deviceId: id
                        ? { exact: id }
                        : undefined,

                    width: {
                        ideal: 640
                    },

                    height: {
                        ideal: 480
                    }
                },

                audio: false

            });


        console.log(
            'getUserMedia OK.'
        );


        // ====================================================
        // VÍDEO ÚNICO PARA TODO O SISTEMA
        // ====================================================

        const hiddenVideo =
            document.createElement('video');


        hiddenVideo.srcObject =
            stream;


        hiddenVideo.muted =
            true;


        hiddenVideo.autoplay =
            true;


        hiddenVideo.playsInline =
            true;


        hiddenVideo.setAttribute(
            'playsinline',
            ''
        );


        hiddenVideo.style.position =
            'fixed';


        hiddenVideo.style.left =
            '-9999px';


        hiddenVideo.style.top =
            '-9999px';


        hiddenVideo.style.width =
            '1px';


        hiddenVideo.style.height =
            '1px';


        document.body.appendChild(
            hiddenVideo
        );


        await hiddenVideo.play();


        // ====================================================
        // ESPERA O VÍDEO TER DIMENSÕES
        // ====================================================

        await waitForVideoReady(
            hiddenVideo
        );


        console.log(
            `Vídeo da câmera pronto: ${hiddenVideo.videoWidth}x${hiddenVideo.videoHeight}`
        );


        // ====================================================
        // IMPORTA CONTROLADORES
        // ====================================================

        const {
            EmotionController
        } = await import(
            './detec_emotion.js'
        );


        const {
            HologramController
        } = await import(
            './control_holo.js'
        );


        // ====================================================
        // CRIA CONTROLADORES
        // ====================================================

        hCtrl =
            new HologramController();


        eCtrl =
            new EmotionController();


        console.log(
            'EmotionController:',
            eCtrl
        );


        console.log(
            'HologramController:',
            hCtrl
        );


        // ====================================================
        // SUBSTITUI OS VÍDEOS POR CANVAS
        // ====================================================

        FACE_IDS.forEach(
            faceId => {

                const videoEl =
                    document.getElementById(
                        faceId
                    );


                if (!videoEl) {

                    console.warn(
                        `Elemento ${faceId} não encontrado.`
                    );

                    return;
                }


                const canvas =
                    document.createElement(
                        'canvas'
                    );


                canvas.width = 300;
                canvas.height = 300;


                canvas.id =
                    faceId + '_canvas';


                // Mantém aparência/posicionamento original
                canvas.style.cssText =
                    videoEl.style.cssText;


                canvas.className =
                    videoEl.className;


                videoEl.parentNode.replaceChild(
                    canvas,
                    videoEl
                );


                eCtrl.registerCanvas(
                    faceId,
                    canvas,
                    hiddenVideo
                );


                console.log(
                    `Canvas registrado: ${faceId}`
                );
            }
        );


        // ====================================================
        // CARROSSEL
        // ====================================================

        hCtrl._onCarouselChange =
            (
                faceEmotions,
                inEmotion,
                outEmotion,
                direction
            ) => {

                // ------------------------------------------------
                // ATUALIZA O WIDGET INFINITO
                // ------------------------------------------------

                updateInfinityWidget(
                    faceEmotions,
                    inEmotion,
                    outEmotion,
                    direction
                );


                // ------------------------------------------------
                // ATUALIZA OS RÓTULOS
                // ------------------------------------------------

                updateCarouselLabels(
                    faceEmotions
                );


                // ------------------------------------------------
                // ÁUDIO DO CARROSSEL
                //
                // O vídeo que está em videoTop determina
                // qual música deve tocar.
                // ------------------------------------------------

                if (carouselActive) {

                    const topFace =
                        faceEmotions.find(
                            item =>
                                item.face === 'videoTop'
                        );


                    if (
                        topFace &&
                        topFace.emotion
                    ) {

                        console.log(
                            'Carrossel — expressão no topo:',
                            topFace.emotion
                        );


                        playEmotionAudio(
                            topFace.emotion
                        );
                    }
                }
            };


        // ====================================================
        // EMOÇÕES
        // ====================================================

        eCtrl.onEmotionChange =
            (
                emotion,
                confidence
            ) => {

                console.log(
                    'MAIN recebeu emoção:',
                    emotion,
                    confidence
                );


                // =================================================
                // NO CARROSSEL:
                //
                // A detecção continua rodando, mas a expressão
                // detectada pela câmera NÃO altera o holograma
                // nem o áudio.
                //
                // O áudio é controlado exclusivamente pelo
                // vídeo que está atualmente no topo.
                // =================================================

                if (carouselActive) {
                    return;
                }


                const expressionName =
                    document.getElementById(
                        'expressionName'
                    );


                if (expressionName) {

                    expressionName.innerText =
                        emotion.toUpperCase();
                }


                const confidenceFill =
                    document.getElementById(
                        'confidenceFill'
                    );


                if (confidenceFill) {

                    confidenceFill.style.width =
                        (
                            confidence * 100
                        ) + '%';
                }


                if (hCtrl) {

                    hCtrl.applyEmotionFilter(
                        emotion,
                        confidence
                    );
                }


                playEmotionAudio(
                    emotion
                );
            };


        // ====================================================
        // INICIA DETECÇÃO
        // ====================================================

        console.log(
            '================================================'
        );

        console.log(
            'Iniciando detecção...'
        );

        console.log(
            'DEBUG eCtrl =',
            eCtrl
        );

        console.log(
            'DEBUG startDetection =',
            eCtrl?.startDetection
        );

        console.log(
            '================================================'
        );


        await eCtrl.startDetection(
            stream,
            hiddenVideo
        );


        // ====================================================
        // ATIVA CONTROLES
        // ====================================================

        document.getElementById(
            'carouselToggleBtn'
        ).disabled = false;


        document.getElementById(
            'landmarksToggleBtn'
        ).disabled = false;


        updateStatus(
            'Holograma Online',
            'success'
        );


        console.log(
            'Holograma iniciado com sucesso.'
        );


    } catch (error) {

        console.error(
            'ERRO AO INICIAR HOLOGRAMA:',
            error
        );


        updateStatus(
            'Erro ao iniciar',
            'danger'
        );
    }
}


// ============================================================
// ESPERA VÍDEO
// ============================================================

function waitForVideoReady(video) {

    return new Promise(
        resolve => {

            if (
                video.readyState >= 2 &&
                video.videoWidth > 0
            ) {

                resolve();
                return;
            }


            const check =
                () => {

                    if (
                        video.readyState >= 2 &&
                        video.videoWidth > 0 &&
                        video.videoHeight > 0
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


// ============================================================
// ÁUDIO
// ============================================================

function playEmotionAudio(
    emotion
) {

    if (!emotion) {
        return;
    }


    const src =
        AUDIO_MAP[emotion];


    if (!src) {

        console.warn(
            'Áudio não encontrado para a emoção:',
            emotion
        );

        return;
    }


    // --------------------------------------------------------
    // Se já está tocando exatamente esta emoção,
    // não reinicia a música.
    // --------------------------------------------------------

    if (
        emotion === currentEmotion &&
        currentAudio
    ) {

        return;
    }


    console.log(
        'Trocando áudio:',
        currentEmotion,
        '→',
        emotion
    );


    currentEmotion =
        emotion;


    if (currentAudio) {

        const oldAudio =
            currentAudio;


        currentAudio =
            null;


        fadeOut(
            oldAudio,
            () => {

                startAudio(src);
            }
        );

    } else {

        startAudio(src);
    }
}


function startAudio(src) {

    const audio =
        new Audio(src);


    audio.loop =
        true;


    audio.volume =
        0;


    audio.play().catch(
        error => {

            console.warn(
                'Áudio bloqueado pelo navegador:',
                error
            );
        }
    );


    fadeIn(
        audio
    );


    currentAudio =
        audio;
}


function fadeOut(
    audio,
    onDone
) {

    clearInterval(
        fadeInterval
    );


    if (!audio) {

        if (onDone) {
            onDone();
        }

        return;
    }


    const step =
        Math.max(
            audio.volume /
            (FADE_DURATION / 50),
            0.01
        );


    fadeInterval =
        setInterval(
            () => {

                audio.volume =
                    Math.max(
                        0,
                        audio.volume - step
                    );


                if (
                    audio.volume <= 0
                ) {

                    clearInterval(
                        fadeInterval
                    );


                    audio.pause();


                    audio.src =
                        '';


                    if (onDone) {
                        onDone();
                    }
                }

            },
            50
        );
}


function fadeIn(
    audio
) {

    clearInterval(
        fadeInterval
    );


    const target =
        0.7;


    const step =
        target /
        (FADE_DURATION / 50);


    fadeInterval =
        setInterval(
            () => {

                audio.volume =
                    Math.min(
                        target,
                        audio.volume + step
                    );


                if (
                    audio.volume >= target
                ) {

                    clearInterval(
                        fadeInterval
                    );
                }

            },
            50
        );
}


function stopAudio() {

    if (currentAudio) {

        fadeOut(
            currentAudio,
            () => {
                currentAudio = null;
            }
        );
    }


    currentEmotion =
        null;
}


// ============================================================
// CARROSSEL
// ============================================================

function toggleCarousel() {

    if (!hCtrl || !eCtrl) {
        return;
    }


    carouselActive =
        !carouselActive;


    const btn =
        document.getElementById(
            'carouselToggleBtn'
        );


    const infinityEl =
        document.getElementById(
            'infinityWidget'
        );


    const aiPanel =
        document.getElementById(
            'aiPanel'
        );


    const carouselPanel =
        document.getElementById(
            'carouselPanel'
        );


    const hintEl =
        document.getElementById(
            'keyboardHint'
        );


    const lBtn =
        document.getElementById(
            'landmarksToggleBtn'
        );


    // ========================================================
    // CARROSSEL ATIVADO
    // ========================================================

    if (carouselActive) {

        // ----------------------------------------------------
        // EmotionController continua ativo para que
        // MediaPipe continue atualizando a segmentação.
        // ----------------------------------------------------

        eCtrl.carouselMode =
            true;


        // ----------------------------------------------------
        // Para qualquer música que estava tocando.
        // ----------------------------------------------------

        stopAudio();


        hCtrl.enableCarousel();


        // ----------------------------------------------------
        // IMPORTANTE:
        //
        // Depois de ativar o carrossel, descobrimos qual
        // emoção está atualmente em videoTop e tocamos
        // a música correspondente.
        //
        // Não usamos mais a música "carousel" como trilha
        // principal enquanto o carrossel está rodando.
        // ----------------------------------------------------

        const faces =
            hCtrl.getCurrentFaceEmotions();


        updateCarouselLabels(
            faces
        );


        updateInfinityWidget(
            faces,
            null,
            null,
            0
        );


        const topFace =
            faces.find(
                item =>
                    item.face === 'videoTop'
            );


        if (
            topFace &&
            topFace.emotion
        ) {

            console.log(
                'Carrossel iniciado — topo:',
                topFace.emotion
            );


            playEmotionAudio(
                topFace.emotion
            );

        } else {

            // Fallback caso ainda não exista emoção no topo.
            console.log(
                'Carrossel iniciado — usando áudio genérico.'
            );


            playEmotionAudio(
                'carousel'
            );
        }


        // ----------------------------------------------------
        // UI
        // ----------------------------------------------------

        hCtrl.enableCarousel();


        btn.classList.add(
            'active'
        );


        btn.innerHTML =
            '∞ CARROSSEL ON';


        infinityEl.classList.add(
            'visible'
        );


        aiPanel.classList.add(
            'hidden'
        );


        carouselPanel.classList.remove(
            'hidden'
        );


        hintEl.classList.remove(
            'hidden'
        );


        lBtn.classList.add(
            'locked'
        );


        lBtn.title =
            'Indisponível no modo carrossel';


        updateStatus(
            'Modo Carrossel Ativo',
            'warning'
        );


        console.log(
            'Carrossel ativado — segmentação continua ativa.'
        );


    // ========================================================
    // CARROSSEL DESATIVADO
    // ========================================================

    } else {

        // ----------------------------------------------------
        // EmotionController nunca foi desligado.
        // ----------------------------------------------------

        eCtrl.carouselMode =
            false;


        stopAudio();


        hCtrl.disableCarousel();


        clearCarouselLabels();


        btn.classList.remove(
            'active'
        );


        btn.innerHTML =
            '∞ CARROSSEL';


        infinityEl.classList.remove(
            'visible'
        );


        aiPanel.classList.remove(
            'hidden'
        );


        carouselPanel.classList.add(
            'hidden'
        );


        hintEl.classList.add(
            'hidden'
        );


        lBtn.classList.remove(
            'locked'
        );


        lBtn.title =
            '';


        updateStatus(
            'Holograma Online',
            'success'
        );


        console.log(
            'Carrossel desativado — segmentação continua ativa.'
        );
    }
}


// ============================================================
// LANDMARKS
// ============================================================

function toggleLandmarks() {

    if (!eCtrl) {
        return;
    }


    if (carouselActive) {
        return;
    }


    landmarksActive =
        !landmarksActive;


    eCtrl.showLandmarks =
        landmarksActive;


    const btn =
        document.getElementById(
            'landmarksToggleBtn'
        );


    btn.classList.toggle(
        'active',
        landmarksActive
    );


    btn.innerHTML =
        landmarksActive
            ? '⬡ PONTOS ON'
            : '⬡ PONTOS FACIAIS';
}


// ============================================================
// TECLADO
// ============================================================

document.addEventListener(
    'keydown',
    (e) => {

        if (
            !carouselActive ||
            !hCtrl
        ) {
            return;
        }


        if (
            e.key === 'ArrowRight' ||
            e.key === 'ArrowDown'
        ) {

            e.preventDefault();

            hCtrl.rotateCarousel(
                +1
            );

        } else if (
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowUp'
        ) {

            e.preventDefault();

            hCtrl.rotateCarousel(
                -1
            );
        }
    }
);


// ============================================================
// UI
// ============================================================

function updateCarouselLabels(
    faceEmotions
) {

    const faceMap = {
        videoTop: 'labelTop',
        videoLeft: 'labelLeft',
        videoRight: 'labelRight',
        videoBottom: 'labelBottom'
    };


    const panelMap = {
        videoTop: 'labelTopPanel',
        videoLeft: 'labelLeftPanel',
        videoRight: 'labelRightPanel',
        videoBottom: 'labelBottomPanel'
    };


    document
        .getElementById(
            'hologramGrid'
        )
        .classList.add(
            'carousel-active'
        );


    faceEmotions.forEach(
        ({
            face,
            emotion,
            color
        }) => {

            const el =
                document.getElementById(
                    faceMap[face]
                );


            if (el) {

                el.innerText =
                    emotion.toUpperCase();

                el.style.color =
                    color;

                el.style.borderColor =
                    color + '88';
            }


            const pel =
                document.getElementById(
                    panelMap[face]
                );


            if (pel) {

                pel.innerText =
                    emotion.toUpperCase();

                pel.style.color =
                    color;
            }
        }
    );
}


function clearCarouselLabels() {

    document
        .getElementById(
            'hologramGrid'
        )
        .classList.remove(
            'carousel-active'
        );
}


function updateInfinityWidget(
    faceEmotions,
    inEmotion,
    outEmotion,
    direction
) {

    const widget =
        document.getElementById(
            'infinityWidget'
        );


    if (
        !widget ||
        !inEmotion
    ) {
        return;
    }


    const inColor =
        hCtrl.getFilterColor(
            inEmotion
        );


    const outColor =
        hCtrl.getFilterColor(
            outEmotion
        );


    const inEl =
        widget.querySelector(
            '.inf-in'
        );


    const outEl =
        widget.querySelector(
            '.inf-out'
        );


    if (inEl) {

        inEl.innerText =
            inEmotion;

        inEl.style.color =
            inColor;
    }


    if (outEl) {

        outEl.innerText =
            outEmotion;

        outEl.style.color =
            outColor;
    }


    widget.classList.remove(
        'pulse'
    );


    void widget.offsetWidth;


    widget.classList.add(
        'pulse'
    );
}


// ============================================================
// STATUS
// ============================================================

function updateStatus(
    message,
    type
) {

    const status =
        document.getElementById(
            'systemStatus'
        );


    if (status) {

        status.innerText =
            message;

        status.className =
            'small mb-2 text-' +
            type;
    }
}


// ============================================================
// EVENTOS
// ============================================================

document
    .getElementById('startBtn')
    .addEventListener(
        'click',
        start
    );


document
    .getElementById('carouselToggleBtn')
    .addEventListener(
        'click',
        toggleCarousel
    );


document
    .getElementById('landmarksToggleBtn')
    .addEventListener(
        'click',
        toggleLandmarks
    );


window.onload =
    init;
```

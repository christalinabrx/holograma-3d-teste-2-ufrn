
export class HologramController {

    constructor() {

        // Ordem física das faces no carrossel
        this._faceIds = [
            'videoBottom',
            'videoLeft',
            'videoTop',
            'videoRight'
        ];


        // ========================================================
        // EMOÇÕES
        // ========================================================

        this.emotionPT = {

            happy:     'FELIZ',
            sad:       'TRISTE',
            angry:     'RAIVA',
            surprised: 'SURPRESO',
            fearful:   'MEDO',
            disgusted: 'NOJO',
            neutral:   'NEUTRO'

        };


        // ========================================================
        // FILTROS
        // ========================================================

        this.filters = {

            happy: {
                css: 'saturate(2) brightness(1.2) sepia(0.2)',
                color: '#FFD700'
            },

            sad: {
                css: 'hue-rotate(180deg) saturate(0.5) brightness(0.8)',
                color: '#4A90D9'
            },

            angry: {
                css: 'hue-rotate(320deg) saturate(3) contrast(1.5)',
                color: '#FF3B30'
            },

            surprised: {
                css: 'brightness(1.5) saturate(1.5)',
                color: '#FF9F0A'
            },

            fearful: {
                css: 'hue-rotate(260deg) saturate(2) brightness(0.9)',
                color: '#BF5AF2'
            },

            disgusted: {
                css: 'hue-rotate(90deg) saturate(2) contrast(1.2)',
                color: '#34C759'
            },

            neutral: {
                css: 'none',
                color: '#8E8E93'
            }

        };


        // ========================================================
        // ESTADO DO CARROSSEL
        // ========================================================

        this.carouselMode = false;

        this.emotionQueue = [
            'happy',
            'sad',
            'angry',
            'surprised',
            'fearful',
            'disgusted',
            'neutral'
        ];

        this.queueOffset = 0;


        // Callback usado pelo main.js
        this._onCarouselChange = null;
    }


    // ============================================================
    // ELEMENTOS
    // ============================================================

    _getEls() {

        return this._faceIds.map(
            id =>
                document.getElementById(
                    id + '_canvas'
                ) ||
                document.getElementById(id)
        );
    }


    // ============================================================
    // MODO IA
    // ============================================================

    applyEmotionFilter(
        emotion,
        confidence
    ) {

        if (this.carouselMode) {
            return;
        }


        const f =
            this.filters[emotion] ||
            this.filters.neutral;


        this._getEls().forEach(
            el => {

                if (el) {

                    el.style.filter =
                        f.css;

                    el.style.opacity =
                        0.5 +
                        confidence * 0.5;
                }
            }
        );
    }


    // ============================================================
    // ALIAS
    // ============================================================

    applyEmotionFilterToCanvases(
        emotion,
        confidence
    ) {

        this.applyEmotionFilter(
            emotion,
            confidence
        );
    }


    // ============================================================
    // ATIVA CARROSSEL
    // ============================================================

    enableCarousel() {

        this.carouselMode =
            true;


        this._applyCarouselFrame();
    }


    // ============================================================
    // DESATIVA CARROSSEL
    // ============================================================

    disableCarousel() {

        this.carouselMode =
            false;


        this._getEls().forEach(
            el => {

                if (el) {

                    el.style.filter =
                        'none';

                    el.style.opacity =
                        1;
                }
            }
        );
    }


    // ============================================================
    // GIRA CARROSSEL
    // ============================================================

    rotateCarousel(
        direction
    ) {

        if (!this.carouselMode) {
            return;
        }


        const len =
            this.emotionQueue.length;


        const previousOffset =
            this.queueOffset;


        // --------------------------------------------------------
        // Novo deslocamento
        // --------------------------------------------------------

        this.queueOffset =
            (
                (
                    this.queueOffset +
                    direction
                ) %
                len +
                len
            ) %
            len;


        // --------------------------------------------------------
        // Emoção que entra e sai
        // --------------------------------------------------------

        const inEmotion =
            direction > 0
                ? this.emotionQueue[
                    (this.queueOffset + 3) % len
                ]
                : this.emotionQueue[
                    this.queueOffset
                ];


        const outEmotion =
            direction > 0
                ? this.emotionQueue[
                    previousOffset % len
                ]
                : this.emotionQueue[
                    (previousOffset + 3) % len
                ];


        // --------------------------------------------------------
        // Aplica novo quadro
        // --------------------------------------------------------

        this._applyCarouselFrame(
            direction,
            inEmotion,
            outEmotion
        );


        return {
            inEmotion,
            outEmotion,
            direction
        };
    }


    // ============================================================
    // APLICA QUADRO DO CARROSSEL
    // ============================================================

    _applyCarouselFrame(
        direction = 0,
        inEmotion = null,
        outEmotion = null
    ) {

        const len =
            this.emotionQueue.length;


        const els =
            this._getEls();


        // --------------------------------------------------------
        // Monta estado atual das quatro faces
        // --------------------------------------------------------

        const faceEmotions =
            this._faceIds.map(
                (id, i) => {

                    const emotion =
                        this.emotionQueue[
                            (
                                this.queueOffset +
                                i
                            ) %
                            len
                        ];


                    return {

                        face: id,

                        emotion: emotion,

                        label:
                            this.emotionPT[emotion] ||
                            emotion.toUpperCase(),

                        color:
                            (
                                this.filters[emotion] ||
                                this.filters.neutral
                            ).color
                    };
                }
            );


        // --------------------------------------------------------
        // Aplica filtros
        // --------------------------------------------------------

        faceEmotions.forEach(
            ({
                emotion
            }, i) => {

                const el =
                    els[i];


                if (!el) {
                    return;
                }


                const f =
                    this.filters[emotion] ||
                    this.filters.neutral;


                el.style.filter =
                    f.css;


                el.style.opacity =
                    1;
            }
        );


        // --------------------------------------------------------
        // CALLBACK
        //
        // IMPORTANTE:
        // neste momento o videoTop JÁ foi atualizado.
        //
        // Portanto faceEmotions contém o estado NOVO.
        // --------------------------------------------------------

        if (
            typeof this._onCarouselChange ===
            'function'
        ) {

            this._onCarouselChange(
                faceEmotions,
                inEmotion,
                outEmotion,
                direction
            );
        }
    }


    // ============================================================
    // RETORNA ESTADO ATUAL
    // ============================================================

    getCurrentFaceEmotions() {

        const len =
            this.emotionQueue.length;


        return this._faceIds.map(
            (id, i) => {

                const emotion =
                    this.emotionQueue[
                        (
                            this.queueOffset +
                            i
                        ) %
                        len
                    ];


                return {

                    face: id,

                    emotion: emotion,

                    label:
                        this.emotionPT[emotion] ||
                        emotion.toUpperCase(),

                    color:
                        (
                            this.filters[emotion] ||
                            this.filters.neutral
                        ).color
                };
            }
        );
    }


    // ============================================================
    // LABEL
    // ============================================================

    getEmotionLabel(
        emotion
    ) {

        return (
            this.emotionPT[emotion] ||
            emotion.toUpperCase()
        );
    }


    // ============================================================
    // COR DO FILTRO
    // ============================================================

    getFilterColor(
        emotion
    ) {

        return (
            this.filters[emotion] ||
            this.filters.neutral
        ).color;
    }
}



// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - pessoa transformando-se em chama
// - HALO = cilindro/aura vermelha + raios radiais
// - raios nascendo da região dos olhos
// - vibração contínua, sem piscar
// - gradiente de fogo no rosto
// - azul discreto nas extremidades da chama
// - glitch baseado EXCLUSIVAMENTE na imagem REAL segmentada
// - partículas explosivas
// - fagulhas amarelas / laranjas
// - dois pontos de explosão
//
// IMPORTANTE:
// Este módulo NÃO detecta emoções.
// Ele apenas recebe uma emoção + confiança.
//
// Compatível com:
// - detecção normal
// - modo carrossel
// ============================================================


export class AngryEffects {

    constructor() {

        // =====================================================
        // ESTADO
        // =====================================================

        this.emotion = 'neutral';

        this.confidence = 0;

        this.intensity = 0;

        this.targetIntensity = 0;

        this.time = performance.now();


        // =====================================================
        // CONFIGURAÇÃO
        // =====================================================

        this.config = {

            // Movimento contínuo.
            // Não é usado para "piscar".
            pulseSpeed: 0.0022,

            // Halo.
            maxGlow: 0.82,

            // Vibração contínua.
            vibrationAmount: 2.4,

            // Vibração dos raios.
            rayVibration: 0.018,

            // Raios.
            rayCount: 22,

            rayLength: 0.19,

            rayWidth: 1.8,

            // Halo/cilindro.
            haloWidth: 0.64,

            haloHeight: 0.72,

            // Fragmentos visuais.
            maxFragments: 42,

            // Mais partículas.
            maxParticles: 150,

            // Glitch.
            glitchIntervalMin: 520,
            glitchIntervalMax: 1250,

            glitchDuration: 90,

            // Quantidade de pedaços reais da imagem.
            maxImageGlitches: 24,

            // Picos.
            peakIntervalMin: 1050,
            peakIntervalMax: 2450

        };


        // =====================================================
        // GLITCH
        // =====================================================

        this.glitchTimer = 0;

        this.nextGlitch =
            this._random(
                this.config.glitchIntervalMin,
                this.config.glitchIntervalMax
            );

        this.glitchRemaining = 0;

        this.imageGlitches = [];


        // =====================================================
        // PICO
        // =====================================================

        this.peakTimer = 0;

        this.nextPeak =
            this._random(
                this.config.peakIntervalMin,
                this.config.peakIntervalMax
            );

        this.peakIntensity = 0;


        // =====================================================
        // FRAGMENTOS
        // =====================================================

        this.fragments = [];


        // =====================================================
        // PARTÍCULAS
        // =====================================================

        this.particles = [];


        // =====================================================
        // FLASH
        //
        // Mantido praticamente desligado.
        // A vibração substitui a necessidade de flash.
        // =====================================================

        this.flash = 0;


        // =====================================================
        // CANVAS TEMPORÁRIO DA CHAMA
        // =====================================================

        this._flameCanvas =
            document.createElement('canvas');

        this._flameCtx =
            this._flameCanvas.getContext('2d');


        // =====================================================
        // CANVAS TEMPORÁRIO DO GLITCH
        // =====================================================

        this._glitchCanvas =
            document.createElement('canvas');

        this._glitchCtx =
            this._glitchCanvas.getContext('2d');

    }


    // =========================================================
    // RECEBE EMOÇÃO
    // =========================================================

    setEmotion(
        emotion,
        confidence
    ) {

        this.emotion =
            emotion || 'neutral';


        this.confidence =
            Number.isFinite(confidence)
                ? Math.max(
                    0,
                    Math.min(
                        1,
                        confidence
                    )
                )
                : 0;


        if (
            this.emotion === 'angry'
        ) {

            this.targetIntensity =
                Math.max(
                    0,
                    Math.min(
                        1,
                        (
                            this.confidence -
                            0.25
                        ) /
                        0.75
                    )
                );

        } else {

            this.targetIntensity = 0;

        }

    }


    // =========================================================
    // UPDATE
    // =========================================================

    update(delta) {

        const dt =
            Math.max(
                0,
                Math.min(
                    Number.isFinite(delta)
                        ? delta
                        : 16.67,
                    100
                )
            );


        // =====================================================
        // SUAVIZA INTENSIDADE
        // =====================================================

        const smoothing =
            this.targetIntensity >
            this.intensity
                ? 0.08
                : 0.045;


        this.intensity +=
            (
                this.targetIntensity -
                this.intensity
            ) *
            smoothing;


        // =====================================================
        // TEMPO
        // =====================================================

        this.time += dt;


        // =====================================================
        // GLITCH
        // =====================================================

        if (
            this.intensity >
            0.08
        ) {

            this.glitchTimer += dt;


            if (
                this.glitchTimer >=
                this.nextGlitch
            ) {

                this.glitchRemaining =
                    this.config.glitchDuration *
                    (
                        0.75 +
                        this.intensity *
                        0.65
                    );


                this.glitchTimer = 0;


                this.nextGlitch =
                    this._random(
                        this.config.glitchIntervalMin,
                        this.config.glitchIntervalMax
                    ) *
                    (
                        1.25 -
                        this.intensity *
                        0.30
                    );


                this._prepareImageGlitches();

            }

        } else {

            this.glitchTimer = 0;

            this.glitchRemaining = 0;

            this.imageGlitches.length = 0;

        }


        if (
            this.glitchRemaining >
            0
        ) {

            this.glitchRemaining -= dt;


            if (
                this.glitchRemaining <
                0
            ) {

                this.glitchRemaining = 0;

            }

        }


        // =====================================================
        // PICO DE RAIVA
        // =====================================================

        if (
            this.intensity >
            0.18
        ) {

            this.peakTimer += dt;


            if (
                this.peakTimer >=
                this.nextPeak
            ) {

                this.peakTimer = 0;


                this.peakIntensity =
                    0.45 +
                    Math.random() *
                    0.55;


                // Flash praticamente imperceptível.
                this.flash =
                    0.012 +
                    Math.random() *
                    0.018;


                this._spawnPeakFragments();

                this._spawnPeakParticles();


                this.nextPeak =
                    this._random(
                        this.config.peakIntervalMin,
                        this.config.peakIntervalMax
                    ) /
                    (
                        0.72 +
                        this.intensity *
                        0.42
                    );

            }

        } else {

            this.peakTimer = 0;

        }


        // =====================================================
        // DECAY DO PICO
        // =====================================================

        this.peakIntensity *=
            Math.pow(
                0.90,
                dt / 16.67
            );


        // =====================================================
        // DECAY DO FLASH
        // =====================================================

        this.flash *=
            Math.pow(
                0.84,
                dt / 16.67
            );


        // =====================================================
        // ATUALIZA FRAGMENTOS
        // =====================================================

        for (
            let i =
                this.fragments.length - 1;

            i >= 0;

            i--
        ) {

            const fragment =
                this.fragments[i];


            fragment.life -= dt;


            fragment.x +=
                fragment.vx * dt;


            fragment.y +=
                fragment.vy * dt;


            fragment.rotation +=
                fragment.rotationSpeed * dt;


            fragment.vx *=
                Math.pow(
                    0.996,
                    dt
                );


            fragment.vy *=
                Math.pow(
                    0.996,
                    dt
                );


            if (
                fragment.life <= 0
            ) {

                this.fragments.splice(
                    i,
                    1
                );

            }

        }


        // =====================================================
        // ATUALIZA PARTÍCULAS
        // =====================================================

        for (
            let i =
                this.particles.length - 1;

            i >= 0;

            i--
        ) {

            const particle =
                this.particles[i];


            particle.life -= dt;


            particle.x +=
                particle.vx * dt;


            particle.y +=
                particle.vy * dt;


            // Turbulência orgânica.
            particle.vx +=
                Math.sin(
                    this.time * 0.004 +
                    particle.seed
                ) *
                0.0008 *
                dt;


            particle.vy +=
                Math.cos(
                    this.time * 0.003 +
                    particle.seed
                ) *
                0.0005 *
                dt;


            particle.vx *=
                Math.pow(
                    0.997,
                    dt
                );


            particle.vy *=
                Math.pow(
                    0.997,
                    dt
                );


            if (
                particle.life <= 0
            ) {

                this.particles.splice(
                    i,
                    1
                );

            }

        }


        // =====================================================
        // SAIU DO ANGRY
        // =====================================================

        if (
            this.intensity < 0.01 &&
            this.targetIntensity <= 0
        ) {

            this.fragments.length = 0;

            this.particles.length = 0;

            this.imageGlitches.length = 0;

            this.peakIntensity = 0;

            this.flash = 0;

        }

    }


    // =========================================================
    // DESENHA
    // =========================================================

    draw(
        ctx,
        options
    ) {

        if (
            !ctx ||
            !options ||
            this.intensity < 0.01
        ) {

            return;

        }


        const {

            drawX = 0,

            drawY = 0,

            drawWidth =
                ctx.canvas.width,

            drawHeight =
                ctx.canvas.height,

            personCanvas = null,

            sourceX = 0,

            sourceY = 0,

            sourceWidth = 0,

            sourceHeight = 0,

            // =================================================
            // LANDMARKS OPCIONAIS
            //
            // Compatível com face-api.js.
            //
            // Pode receber:
            // {
            //   leftEye: [...],
            //   rightEye: [...]
            // }
            //
            // ou:
            // {
            //   positions: {
            //      leftEye: [...],
            //      rightEye: [...]
            //   }
            // }
            // =================================================

            landmarks = null

        } = options;


        const baseSize =
            Math.min(
                drawWidth,
                drawHeight
            );


        // =====================================================
        // VIBRAÇÃO GLOBAL
        //
        // Pequena.
        // O movimento é contínuo.
        // Não há piscada.
        // =====================================================

        const vibration =
            this.config.vibrationAmount *
            this.intensity;


        const vibrationX =
            Math.sin(
                this.time * 0.037
            ) *
            vibration;


        const vibrationY =
            Math.cos(
                this.time * 0.031
            ) *
            vibration;


        // =====================================================
        // CENTRO GERAL DO HALO
        // =====================================================

        const cx =
            drawX +
            drawWidth / 2 +
            vibrationX;


        const cy =
            drawY +
            drawHeight * 0.45 +
            vibrationY;


        // =====================================================
        // ORIGEM DOS RAIOS
        //
        // Tenta usar os olhos.
        // Se landmarks não estiverem disponíveis,
        // utiliza um ponto estável na região superior.
        // =====================================================

        const rayOrigin =
            this._resolveEyeOrigin(
                landmarks,
                drawX,
                drawY,
                drawWidth,
                drawHeight,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight
            );


        // =====================================================
        // PULSAÇÃO DE TENSÃO
        //
        // Muito pequena.
        //
        // Isso dá vida ao halo sem fazê-lo piscar.
        // =====================================================

        const pulse =
            (
                Math.sin(
                    this.time *
                    this.config.pulseSpeed
                ) +
                1
            ) / 2;


        const tension =
            this.intensity *
            (
                0.91 +
                pulse * 0.09
            );


        const peak =
            this.peakIntensity *
            this.intensity;


        ctx.save();


        // =====================================================
        // HALO
        //
        // Cilindro/aura + vibração.
        // =====================================================

        this._drawHalo(
            ctx,
            cx,
            cy,
            drawX,
            drawY,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        // =====================================================
        // GRADIENTE DE CHAMA SOBRE A PESSOA
        // =====================================================

        if (
            personCanvas &&
            sourceWidth > 0 &&
            sourceHeight > 0
        ) {

            this._drawFlameGradient(
                ctx,
                personCanvas,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                drawX,
                drawY,
                drawWidth,
                drawHeight,
                tension
            );

        }


        // =====================================================
        // GLITCH
        //
        // SOMENTE IMAGEM REAL.
        //
        // Nenhum retângulo colorido.
        // Nenhuma linha.
        // =====================================================

        if (
            this.glitchRemaining > 0 &&
            personCanvas &&
            sourceWidth > 0 &&
            sourceHeight > 0
        ) {

            this._drawImageGlitch(
                ctx,
                personCanvas,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                drawX,
                drawY,
                drawWidth,
                drawHeight,
                tension
            );

        }


        // =====================================================
        // FLASH
        // =====================================================

        if (
            this.flash > 0.005
        ) {

            const flashGradient =
                ctx.createRadialGradient(
                    rayOrigin.x,
                    rayOrigin.y,
                    0,
                    rayOrigin.x,
                    rayOrigin.y,
                    baseSize * 0.30
                );


            flashGradient.addColorStop(
                0,
                `rgba(255, 180, 50, ${
                    this.flash *
                    this.intensity *
                    0.25
                })`
            );


            flashGradient.addColorStop(
                1,
                'rgba(255, 30, 0, 0)'
            );


            ctx.fillStyle =
                flashGradient;


            ctx.fillRect(
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );

        }


        // =====================================================
        // FRAGMENTOS
        // =====================================================

        this._drawFragments(
            ctx,
            tension,
            drawX,
            drawY
        );


        // =====================================================
        // PARTÍCULAS
        // =====================================================

        this._drawParticles(
            ctx,
            tension,
            drawX,
            drawY
        );


        // =====================================================
        // RAIOS
        //
        // AGORA NASCEM DOS OLHOS.
        // =====================================================

        this._drawEnergyRays(
            ctx,
            rayOrigin.x,
            rayOrigin.y,
            drawX,
            drawY,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        ctx.restore();

    }


    // =========================================================
    // RESOLVE ORIGEM DOS RAIOS
    // =========================================================

    _resolveEyeOrigin(
        landmarks,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight
    ) {

        // -----------------------------------------------------
        // Tenta localizar os olhos.
        // -----------------------------------------------------

        let leftEye = null;

        let rightEye = null;


        if (
            landmarks
        ) {

            // Formato direto.
            if (
                landmarks.leftEye &&
                landmarks.rightEye
            ) {

                leftEye =
                    landmarks.leftEye;

                rightEye =
                    landmarks.rightEye;

            }

            // Formato comum do face-api.
            else if (
                landmarks.positions &&
                landmarks.positions.length
            ) {

                const positions =
                    landmarks.positions;


                // Não assume índices rígidos.
                // face-api fornece getLeftEye/getRightEye
                // normalmente no objeto completo.
                if (
                    landmarks.getLeftEye &&
                    landmarks.getRightEye
                ) {

                    leftEye =
                        landmarks.getLeftEye();

                    rightEye =
                        landmarks.getRightEye();

                }

            }

            // Formato alternativo.
            if (
                !leftEye &&
                landmarks.getLeftEye
            ) {

                leftEye =
                    landmarks.getLeftEye();

            }

            if (
                !rightEye &&
                landmarks.getRightEye
            ) {

                rightEye =
                    landmarks.getRightEye();

            }

        }


        // -----------------------------------------------------
        // Converte array de pontos em centro.
        // -----------------------------------------------------

        const getCenter =
            (eye) => {

                if (
                    !eye ||
                    !eye.length
                ) {

                    return null;

                }


                let sumX = 0;

                let sumY = 0;

                let count = 0;


                for (
                    const point of eye
                ) {

                    if (
                        point &&
                        Number.isFinite(point.x) &&
                        Number.isFinite(point.y)
                    ) {

                        sumX += point.x;

                        sumY += point.y;

                        count++;

                    }

                }


                if (
                    count === 0
                ) {

                    return null;

                }


                return {

                    x:
                        sumX / count,

                    y:
                        sumY / count

                };

            };


        const left =
            getCenter(
                leftEye
            );


        const right =
            getCenter(
                rightEye
            );


        // -----------------------------------------------------
        // Se encontrou os dois olhos.
        // -----------------------------------------------------

        if (
            left &&
            right
        ) {

            const eyeX =
                (
                    left.x +
                    right.x
                ) / 2;


            const eyeY =
                (
                    left.y +
                    right.y
                ) / 2;


            // face-api normalmente trabalha
            // em coordenadas do vídeo original.
            //
            // Converte para o espaço de desenho.
            if (
                sourceWidth > 0 &&
                sourceHeight > 0
            ) {

                const normalizedX =
                    (
                        eyeX -
                        sourceX
                    ) /
                    sourceWidth;


                const normalizedY =
                    (
                        eyeY -
                        sourceY
                    ) /
                    sourceHeight;


                return {

                    x:
                        drawX +
                        normalizedX *
                        drawWidth,

                    y:
                        drawY +
                        normalizedY *
                        drawHeight

                };

            }


            return {

                x:
                    drawX +
                    eyeX,

                y:
                    drawY +
                    eyeY

            };

        }


        // -----------------------------------------------------
        // FALLBACK
        //
        // Caso o detector ainda não envie landmarks.
        // Fica no centro superior do enquadramento.
        // -----------------------------------------------------

        return {

            x:
                drawX +
                drawWidth * 0.50,

            y:
                drawY +
                drawHeight * 0.33

        };

    }


    // =========================================================
    // HALO
    //
    // O HALO É:
    //
    // 1. cilindro/aura vermelha
    // 2. núcleo quente
    // 3. vibração espacial
    //
    // Os raios são desenhados separadamente, mas pertencem
    // visualmente ao mesmo conjunto.
    // =========================================================

    _drawHalo(
        ctx,
        cx,
        cy,
        x,
        y,
        width,
        height,
        intensity,
        peak
    ) {

        // =====================================================
        // LIMITES RÍGIDOS
        //
        // O halo inteiro precisa permanecer dentro do canvas.
        // =====================================================

        const safeLeft =
            x;


        const safeTop =
            y;


        const safeRight =
            x +
            width;


        const safeBottom =
            y +
            height;


        const maxRadiusX =
            Math.min(
                cx - safeLeft,
                safeRight - cx
            );


        const maxRadiusY =
            Math.min(
                cy - safeTop,
                safeBottom - cy
            );


        if (
            maxRadiusX <= 0 ||
            maxRadiusY <= 0
        ) {

            return;

        }


        const radiusX =
            Math.max(
                1,
                Math.min(
                    maxRadiusX * 0.94,
                    width *
                    (
                        0.27 +
                        intensity * 0.12
                    )
                )
            );


        const radiusY =
            Math.max(
                1,
                Math.min(
                    maxRadiusY * 0.94,
                    height *
                    (
                        0.34 +
                        intensity * 0.13
                    )
                )
            );


        const alpha =
            Math.min(
                this.config.maxGlow,
                0.13 +
                intensity * 0.27 +
                peak * 0.10
            );


        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        // =====================================================
        // CILINDRO / AURA PRINCIPAL
        //
        // Gradiente vertical:
        // azul-violeta muito discreto na periferia
        // vermelho
        // laranja
        // amarelo
        // =====================================================

        const gradient =
            ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                Math.max(
                    radiusX,
                    radiusY
                )
            );


        gradient.addColorStop(
            0,
            `rgba(255, 90, 20, ${
                alpha
            })`
        );


        gradient.addColorStop(
            0.22,
            `rgba(255, 55, 10, ${
                alpha * 0.82
            })`
        );


        gradient.addColorStop(
            0.52,
            `rgba(220, 20, 8, ${
                alpha * 0.48
            })`
        );


        gradient.addColorStop(
            0.78,
            `rgba(120, 5, 18, ${
                alpha * 0.20
            })`
        );


        // Azul apenas na periferia.
        gradient.addColorStop(
            0.92,
            `rgba(35, 45, 120, ${
                alpha * 0.075
            })`
        );


        gradient.addColorStop(
            1,
            'rgba(20, 0, 50, 0)'
        );


        ctx.fillStyle =
            gradient;


        // =====================================================
        // Elipse limitada ao enquadramento.
        // =====================================================

        ctx.beginPath();


        ctx.ellipse(
            cx,
            cy,
            radiusX,
            radiusY,
            0,
            0,
            Math.PI * 2
        );


        ctx.fill();


        // =====================================================
        // NÚCLEO QUENTE
        // =====================================================

        const coreRadiusX =
            radiusX *
            0.60;


        const coreRadiusY =
            radiusY *
            0.64;


        const core =
            ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                Math.max(
                    coreRadiusX,
                    coreRadiusY
                )
            );


        core.addColorStop(
            0,
            `rgba(255, 185, 45, ${
                0.08 +
                intensity * 0.12
            })`
        );


        core.addColorStop(
            0.24,
            `rgba(255, 95, 12, ${
                0.13 +
                intensity * 0.10
            })`
        );


        core.addColorStop(
            0.58,
            'rgba(235, 25, 5, 0.08)'
        );


        core.addColorStop(
            1,
            'rgba(255, 0, 0, 0)'
        );


        ctx.fillStyle =
            core;


        ctx.beginPath();


        ctx.ellipse(
            cx,
            cy,
            coreRadiusX,
            coreRadiusY,
            0,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.restore();

    }


    // =========================================================
    // GRADIENTE DE CHAMA
    // =========================================================

    _drawFlameGradient(
        ctx,
        personCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        intensity
    ) {

        const canvas =
            this._flameCanvas;


        const flameCtx =
            this._flameCtx;


        if (
            canvas.width !== Math.ceil(drawWidth) ||
            canvas.height !== Math.ceil(drawHeight)
        ) {

            canvas.width =
                Math.max(
                    1,
                    Math.ceil(drawWidth)
                );

            canvas.height =
                Math.max(
                    1,
                    Math.ceil(drawHeight)
                );

        }


        flameCtx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =====================================================
        // GRADIENTE PRINCIPAL
        //
        // Agora muito menos vermelho.
        //
        // topo/periferia:
        // azul profundo discreto
        //
        // meio:
        // vermelho
        //
        // núcleo:
        // laranja/amarelo
        //
        // base:
        // vermelho/azul discreto
        // =====================================================

        const gradient =
            flameCtx.createLinearGradient(
                0,
                0,
                0,
                canvas.height
            );


        gradient.addColorStop(
            0,
            'rgba(35, 35, 115, 0.25)'
        );


        gradient.addColorStop(
            0.10,
            'rgba(105, 10, 35, 0.30)'
        );


        gradient.addColorStop(
            0.25,
            'rgba(210, 20, 8, 0.32)'
        );


        gradient.addColorStop(
            0.42,
            'rgba(255, 65, 8, 0.42)'
        );


        gradient.addColorStop(
            0.55,
            'rgba(255, 145, 15, 0.52)'
        );


        gradient.addColorStop(
            0.68,
            'rgba(255, 205, 45, 0.43)'
        );


        gradient.addColorStop(
            0.80,
            'rgba(255, 65, 5, 0.34)'
        );


        gradient.addColorStop(
            0.92,
            'rgba(120, 10, 25, 0.28)'
        );


        gradient.addColorStop(
            1,
            'rgba(30, 30, 100, 0.20)'
        );


        flameCtx.fillStyle =
            gradient;


        flameCtx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =====================================================
        // NÚCLEO DA CHAMA
        //
        // Amarelo quente.
        // =====================================================

        const hot =
            flameCtx.createRadialGradient(
                canvas.width * 0.50,
                canvas.height * 0.46,
                0,
                canvas.width * 0.50,
                canvas.height * 0.46,
                Math.min(
                    canvas.width,
                    canvas.height
                ) * 0.46
            );


        hot.addColorStop(
            0,
            `rgba(255, 225, 75, ${
                0.15 +
                intensity * 0.14
            })`
        );


        hot.addColorStop(
            0.20,
            `rgba(255, 175, 25, ${
                0.18 +
                intensity * 0.10
            })`
        );


        hot.addColorStop(
            0.43,
            'rgba(255, 85, 8, 0.19)'
        );


        hot.addColorStop(
            0.70,
            'rgba(225, 15, 5, 0.08)'
        );


        hot.addColorStop(
            0.88,
            'rgba(45, 40, 135, 0.055)'
        );


        hot.addColorStop(
            1,
            'rgba(255, 0, 0, 0)'
        );


        flameCtx.fillStyle =
            hot;


        flameCtx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =====================================================
        // SEGMENTAÇÃO REAL
        // =====================================================

        flameCtx.globalCompositeOperation =
            'destination-in';


        flameCtx.drawImage(
            personCanvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =====================================================
        // DESENHA SOBRE A PESSOA
        // =====================================================

        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        ctx.globalAlpha =
            0.68;


        ctx.drawImage(
            canvas,
            drawX,
            drawY
        );


        ctx.restore();

    }


    // =========================================================
    // PREPARA GLITCH
    //
    // SOMENTE REGIÕES DA IMAGEM REAL.
    //
    // Não existem cores artificiais aqui.
    // =========================================================

    _prepareImageGlitches() {

        this.imageGlitches.length = 0;


        const amount =
            Math.floor(
                7 +
                this.intensity *
                (
                    this.config.maxImageGlitches -
                    7
                )
            );


        for (
            let i = 0;

            i < amount;

            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            // Região concentrada na cabeça.
            const radius =
                0.10 +
                Math.random() *
                0.34;


            const centerX =
                0.50 +
                Math.cos(angle) *
                radius *
                0.62;


            const centerY =
                0.40 +
                Math.sin(angle) *
                radius;


            // Fragmentos menores.
            const width =
                0.025 +
                Math.random() *
                0.075;


            const height =
                0.018 +
                Math.random() *
                0.065;


            const outward =
                0.018 +
                Math.random() *
                0.085;


            this.imageGlitches.push({

                x:
                    Math.max(
                        0,
                        Math.min(
                            1 - width,
                            centerX -
                            width / 2
                        )
                    ),


                y:
                    Math.max(
                        0,
                        Math.min(
                            1 - height,
                            centerY -
                            height / 2
                        )
                    ),


                width,

                height,


                offsetX:
                    Math.cos(angle) *
                    outward,


                offsetY:
                    Math.sin(angle) *
                    outward,


                rotation:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.045,


                alpha:
                    0.22 +
                    Math.random() *
                    0.38

            });

        }

    }


    // =========================================================
    // DESENHA GLITCH
    //
    // IMPORTANTE:
    //
    // Nenhuma linha.
    // Nenhum fillRect.
    // Nenhum stroke.
    // Nenhuma cor sólida.
    //
    // Apenas cópias deslocadas da imagem REAL.
    // =========================================================

    _drawImageGlitch(
        ctx,
        personCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        intensity
    ) {

        if (
            !this.imageGlitches.length
        ) {

            return;

        }


        const remainingRatio =
            Math.max(
                0,
                Math.min(
                    1,
                    this.glitchRemaining /
                    this.config.glitchDuration
                )
            );


        for (
            const glitch
            of this.imageGlitches
        ) {

            // Pequeno jitter.
            const jitterX =
                (
                    Math.random() -
                    0.5
                ) *
                0.008 *
                intensity;


            const jitterY =
                (
                    Math.random() -
                    0.5
                ) *
                0.008 *
                intensity;


            const sx =
                sourceX +
                glitch.x *
                sourceWidth;


            const sy =
                sourceY +
                glitch.y *
                sourceHeight;


            const sw =
                Math.max(
                    1,
                    glitch.width *
                    sourceWidth
                );


            const sh =
                Math.max(
                    1,
                    glitch.height *
                    sourceHeight
                );


            const dx =
                drawX +
                (
                    glitch.x +
                    glitch.offsetX +
                    jitterX
                ) *
                drawWidth;


            const dy =
                drawY +
                (
                    glitch.y +
                    glitch.offsetY +
                    jitterY
                ) *
                drawHeight;


            const dw =
                Math.max(
                    1,
                    glitch.width *
                    drawWidth
                );


            const dh =
                Math.max(
                    1,
                    glitch.height *
                    drawHeight
                );


            ctx.save();


            ctx.globalCompositeOperation =
                'screen';


            ctx.globalAlpha =
                glitch.alpha *
                intensity *
                remainingRatio;


            ctx.translate(
                dx + dw / 2,
                dy + dh / 2
            );


            ctx.rotate(
                glitch.rotation
            );


            // =================================================
            // SOMENTE IMAGEM REAL.
            // =================================================

            ctx.drawImage(

                personCanvas,

                sx,
                sy,
                sw,
                sh,

                -dw / 2,
                -dh / 2,
                dw,
                dh

            );


            ctx.restore();

        }

    }


    // =========================================================
    // FRAGMENTOS
    // =========================================================

    _drawFragments(
        ctx,
        intensity,
        drawX,
        drawY
    ) {

        for (
            const fragment
            of this.fragments
        ) {

            const alpha =
                Math.max(
                    0,
                    Math.min(
                        1,
                        fragment.life /
                        fragment.maxLife
                    )
                ) *
                intensity;


            if (
                alpha <= 0
            ) {

                continue;

            }


            ctx.save();


            ctx.translate(
                drawX +
                fragment.x,
                drawY +
                fragment.y
            );


            ctx.rotate(
                fragment.rotation
            );


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                fragment.color;


            ctx.fillRect(
                -fragment.width / 2,
                -fragment.height / 2,
                fragment.width,
                fragment.height
            );


            ctx.restore();

        }

    }


    // =========================================================
    // PARTÍCULAS / FAGULHAS
    // =========================================================

    _drawParticles(
        ctx,
        intensity,
        drawX,
        drawY
    ) {

        for (
            const particle
            of this.particles
        ) {

            const life =
                Math.max(
                    0,
                    Math.min(
                        1,
                        particle.life /
                        particle.maxLife
                    )
                );


            const alpha =
                life *
                intensity *
                particle.alpha;


            if (
                alpha <= 0
            ) {

                continue;

            }


            ctx.save();


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                particle.color;


            const length =
                particle.size *
                (
                    particle.stretch ||
                    1
                );


            ctx.translate(
                drawX +
                particle.x,
                drawY +
                particle.y
            );


            ctx.rotate(
                Math.atan2(
                    particle.vy,
                    particle.vx
                )
            );


            ctx.fillRect(
                0,
                -particle.size / 2,
                length,
                particle.size
            );


            ctx.restore();

        }

    }


    // =========================================================
    // RAIOS DE ENERGIA
    //
    // Agora:
    // - partem dos olhos
    // - vibram individualmente
    // - não piscam
    // - são cortados nos limites do canvas
    // =========================================================

    _drawEnergyRays(
        ctx,
        cx,
        cy,
        drawX,
        drawY,
        width,
        height,
        intensity,
        peak
    ) {

        const count =
            Math.floor(
                13 +
                intensity *
                (
                    this.config.rayCount -
                    13
                )
            );


        const base =
            Math.min(
                width,
                height
            );


        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        ctx.lineCap =
            'round';


        // =====================================================
        // ÂNGULOS.
        //
        // Rotação lenta e contínua.
        // =====================================================

        const rotation =
            this.time *
            0.00055;


        for (
            let i = 0;

            i < count;

            i++
        ) {

            const angle =
                (
                    Math.PI *
                    2 *
                    i /
                    count
                ) +
                rotation +
                Math.sin(
                    this.time * 0.004 +
                    i * 1.71
                ) *
                0.045;


            // =================================================
            // Vibração individual.
            // =================================================

            const vibration =
                Math.sin(
                    this.time * 0.045 +
                    i * 2.13
                ) *
                base *
                this.config.rayVibration *
                intensity;


            // =================================================
            // Pequena distância entre os olhos e o início.
            // =================================================

            const startRadius =
                base *
                (
                    0.018 +
                    Math.sin(i * 4.1) *
                    0.006
                );


            // =================================================
            // Comprimento.
            // =================================================

            const rawLength =
                base *
                (
                    0.08 +
                    intensity *
                    this.config.rayLength +
                    peak *
                    0.04
                );


            // =================================================
            // PONTO INICIAL.
            // =================================================

            const sx =
                cx +
                Math.cos(angle) *
                startRadius;


            const sy =
                cy +
                Math.sin(angle) *
                startRadius;


            // =================================================
            // PONTO FINAL PROVISÓRIO.
            // =================================================

            const rawEx =
                sx +
                Math.cos(angle) *
                (
                    rawLength +
                    vibration
                );


            const rawEy =
                sy +
                Math.sin(angle) *
                (
                    rawLength +
                    vibration
                );


            // =================================================
            // CLAMP REAL AO CANVAS.
            //
            // Isso impede que qualquer raio atravesse
            // a borda do vídeo.
            // =================================================

            const end =
                this._clipLineToCanvas(
                    sx,
                    sy,
                    rawEx,
                    rawEy,
                    drawX,
                    drawY,
                    width,
                    height
                );


            if (
                !end
            ) {

                continue;

            }


            const ex =
                end.x;


            const ey =
                end.y;


            // =================================================
            // INTENSIDADE.
            //
            // Nunca cai para zero.
            // Isso impede a sensação de piscar.
            // =================================================

            const alpha =
                0.22 +
                intensity * 0.42 +
                peak * 0.15;


            ctx.lineWidth =
                this.config.rayWidth +
                intensity * 1.5;


            // =================================================
            // GRADIENTE DO RAIO.
            //
            // Amarelo no nascimento,
            // laranja/vermelho no exterior.
            // =================================================

            const rayGradient =
                ctx.createLinearGradient(
                    sx,
                    sy,
                    ex,
                    ey
                );


            rayGradient.addColorStop(
                0,
                `rgba(255, 220, 75, ${
                    Math.min(
                        0.92,
                        alpha * 1.15
                    )
                })`
            );


            rayGradient.addColorStop(
                0.18,
                `rgba(255, 130, 25, ${
                    Math.min(
                        0.88,
                        alpha
                    )
                })`
            );


            rayGradient.addColorStop(
                0.58,
                `rgba(255, 55, 8, ${
                    Math.min(
                        0.82,
                        alpha * 0.82
                    )
                })`
            );


            rayGradient.addColorStop(
                1,
                `rgba(175, 15, 15, 0)`
            );


            ctx.strokeStyle =
                rayGradient;


            ctx.beginPath();


            ctx.moveTo(
                sx,
                sy
            );


            // =================================================
            // QUEBRA ORGÂNICA DO RAIO.
            // =================================================

            const perpX =
                Math.cos(
                    angle +
                    Math.PI / 2
                );


            const perpY =
                Math.sin(
                    angle +
                    Math.PI / 2
                );


            const midDistance =
                rawLength *
                0.50;


            const midX =
                sx +
                Math.cos(angle) *
                midDistance +
                perpX *
                vibration *
                1.7;


            const midY =
                sy +
                Math.sin(angle) *
                midDistance +
                perpY *
                vibration *
                1.7;


            // O ponto intermediário também precisa
            // permanecer dentro do canvas.
            const safeMidX =
                Math.max(
                    drawX,
                    Math.min(
                        drawX + width,
                        midX
                    )
                );


            const safeMidY =
                Math.max(
                    drawY,
                    Math.min(
                        drawY + height,
                        midY
                    )
                );


            ctx.lineTo(
                safeMidX,
                safeMidY
            );


            ctx.lineTo(
                ex,
                ey
            );


            ctx.stroke();

        }


        ctx.restore();

    }


    // =========================================================
    // RECORTA UMA LINHA NO RETÂNGULO DO CANVAS
    // =========================================================

    _clipLineToCanvas(
        x1,
        y1,
        x2,
        y2,
        rectX,
        rectY,
        rectWidth,
        rectHeight
    ) {

        const left =
            rectX;


        const right =
            rectX +
            rectWidth;


        const top =
            rectY;


        const bottom =
            rectY +
            rectHeight;


        // =====================================================
        // Se o ponto final já está dentro.
        // =====================================================

        if (
            x2 >= left &&
            x2 <= right &&
            y2 >= top &&
            y2 <= bottom
        ) {

            return {
                x: x2,
                y: y2
            };

        }


        const dx =
            x2 -
            x1;


        const dy =
            y2 -
            y1;


        const intersections = [];


        // =====================================================
        // Borda esquerda.
        // =====================================================

        if (
            dx !== 0
        ) {

            const t =
                (left - x1) /
                dx;


            if (
                t > 0 &&
                t <= 1
            ) {

                const y =
                    y1 +
                    dy * t;


                if (
                    y >= top &&
                    y <= bottom
                ) {

                    intersections.push({
                        t,
                        x: left,
                        y
                    });

                }

            }

        }


        // =====================================================
        // Borda direita.
        // =====================================================

        if (
            dx !== 0
        ) {

            const t =
                (right - x1) /
                dx;


            if (
                t > 0 &&
                t <= 1
            ) {

                const y =
                    y1 +
                    dy * t;


                if (
                    y >= top &&
                    y <= bottom
                ) {

                    intersections.push({
                        t,
                        x: right,
                        y
                    });

                }

            }

        }


        // =====================================================
        // Borda superior.
        // =====================================================

        if (
            dy !== 0
        ) {

            const t =
                (top - y1) /
                dy;


            if (
                t > 0 &&
                t <= 1
            ) {

                const x =
                    x1 +
                    dx * t;


                if (
                    x >= left &&
                    x <= right
                ) {

                    intersections.push({
                        t,
                        x,
                        y: top
                    });

                }

            }

        }


        // =====================================================
        // Borda inferior.
        // =====================================================

        if (
            dy !== 0
        ) {

            const t =
                (bottom - y1) /
                dy;


            if (
                t > 0 &&
                t <= 1
            ) {

                const x =
                    x1 +
                    dx * t;


                if (
                    x >= left &&
                    x <= right
                ) {

                    intersections.push({
                        t,
                        x,
                        y: bottom
                    });

                }

            }

        }


        if (
            !intersections.length
        ) {

            return null;

        }


        intersections.sort(
            (
                a,
                b
            ) =>
                a.t -
                b.t
        );


        return {

            x:
                intersections[0].x,

            y:
                intersections[0].y

        };

    }


    // =========================================================
    // CRIA FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                9 +
                this.intensity *
                18
            );


        for (
            let i = 0;

            i < amount;

            i++
        ) {

            if (
                this.fragments.length >=
                this.config.maxFragments
            ) {

                break;

            }


            const angle =
                Math.random() *
                Math.PI *
                2;


            const radius =
                45 +
                Math.random() *
                115;


            const speed =
                0.025 +
                Math.random() *
                0.12;


            this.fragments.push({

                x:
                    Math.cos(angle) *
                    radius,

                y:
                    Math.sin(angle) *
                    radius *
                    0.82,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                width:
                    2 +
                    Math.random() *
                    9,

                height:
                    1 +
                    Math.random() *
                    5,

                rotation:
                    Math.random() *
                    Math.PI,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.014,

                life:
                    350 +
                    Math.random() *
                    800,

                maxLife:
                    1150,

                color:
                    this._randomFireColor()

            });

        }

    }


    // =========================================================
    // PARTÍCULAS
    //
    // DOIS PONTOS DE EXPLOSÃO.
    //
    // O segundo ponto é propositalmente deslocado,
    // criando uma segunda fonte de fagulhas.
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                26 +
                this.intensity *
                42
            );


        for (
            let i = 0;

            i < amount;

            i++
        ) {

            if (
                this.particles.length >=
                this.config.maxParticles
            ) {

                break;

            }


            // =================================================
            // Escolhe entre os dois focos.
            // =================================================

            const secondary =
                Math.random() <
                0.38;


            let originX;

            let originY;


            if (
                secondary
            ) {

                // Segundo ponto de explosão:
                // ligeiramente abaixo e lateral.
                originX =
                    0.58 *
                    300;

                originY =
                    0.62 *
                    220;

            } else {

                // Fonte principal.
                originX =
                    0;

                originY =
                    0;

            }


            const angle =
                Math.random() *
                Math.PI *
                2;


            const radius =
                18 +
                Math.random() *
                82;


            const speed =
                0.030 +
                Math.random() *
                0.15;


            const fire =
                Math.random();


            let color;


            // =================================================
            // MAIS AMARELO.
            // =================================================

            if (
                fire < 0.28
            ) {

                color =
                    '#fff37a';

            } else if (
                fire < 0.56
            ) {

                color =
                    '#ffd04a';

            } else if (
                fire < 0.78
            ) {

                color =
                    '#ff8a20';

            } else if (
                fire < 0.94
            ) {

                color =
                    '#ff4212';

            } else {

                // Azul muito raro.
                color =
                    '#6e9cff';

            }


            this.particles.push({

                x:
                    originX +
                    Math.cos(angle) *
                    radius,

                y:
                    originY +
                    Math.sin(angle) *
                    radius *
                    0.80,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed -
                    0.015,

                size:
                    0.8 +
                    Math.random() *
                    4.0,

                stretch:
                    1.3 +
                    Math.random() *
                    2.8,

                alpha:
                    0.55 +
                    Math.random() *
                    0.45,

                life:
                    450 +
                    Math.random() *
                    1150,

                maxLife:
                    1600,

                seed:
                    Math.random() *
                    1000,

                color

            });

        }

    }


    // =========================================================
    // CORES DE FOGO
    // =========================================================

    _randomFireColor() {

        const r =
            Math.random();


        if (
            r < 0.25
        ) {

            return '#fff37a';

        }


        if (
            r < 0.50
        ) {

            return '#ffd04a';

        }


        if (
            r < 0.73
        ) {

            return '#ff751c';

        }


        if (
            r < 0.94
        ) {

            return '#ff3212';

        }


        return '#6e9cff';

    }


    // =========================================================
    // UTILITÁRIO
    // =========================================================

    _random(
        min,
        max
    ) {

        return (
            min +
            Math.random() *
            (
                max -
                min
            )
        );

    }

}

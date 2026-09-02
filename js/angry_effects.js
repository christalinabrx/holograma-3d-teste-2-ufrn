// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - pessoa transformando-se em chama
// - halo vibrante
// - raios de energia
// - glitch baseado na imagem REAL segmentada
// - partículas explosivas
// - fagulhas amarelas / laranjas
// - fragmentação digital
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

            // Movimento lento.
            // O efeito não fica piscando.
            pulseSpeed: 0.0028,

            // Halo mais forte.
            maxGlow: 0.92,

            // Pequena vibração espacial.
            vibrationAmount: 2.8,

            // Raios.
            rayCount: 20,

            rayLength: 0.18,

            rayWidth: 2.2,

            // Fragmentos visuais.
            maxFragments: 36,

            // Muitas partículas.
            maxParticles: 110,

            // Glitch.
            glitchIntervalMin: 500,
            glitchIntervalMax: 1200,

            glitchDuration: 95,

            // Quantidade de pedaços reais da imagem.
            maxImageGlitches: 22,

            // Picos.
            peakIntervalMin: 1100,
            peakIntervalMax: 2600

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
        // =====================================================

        // Muito menor agora.
        this.flash = 0;


        // =====================================================
        // CANVAS TEMPORÁRIO DO EFEITO DE CHAMA
        // =====================================================

        this._flameCanvas =
            document.createElement('canvas');

        this._flameCtx =
            this._flameCanvas.getContext('2d');


        // =====================================================
        // CANVAS TEMPORÁRIO PARA GLITCH
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
                        0.7
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
                        0.35
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


                // Flash bem mais discreto.
                this.flash =
                    0.025 +
                    Math.random() *
                    0.045;


                this._spawnPeakFragments();

                this._spawnPeakParticles();


                this.nextPeak =
                    this._random(
                        this.config.peakIntervalMin,
                        this.config.peakIntervalMax
                    ) /
                    (
                        0.7 +
                        this.intensity *
                        0.45
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


            // Pequena turbulência.
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

            sourceHeight = 0

        } = options;


        const baseSize =
            Math.min(
                drawWidth,
                drawHeight
            );


        // =====================================================
        // VIBRAÇÃO
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


        const cx =
            drawX +
            drawWidth / 2 +
            vibrationX;


        const cy =
            drawY +
            drawHeight * 0.45 +
            vibrationY;


        // =====================================================
        // PULSAÇÃO MUITO SUAVE
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
                0.88 +
                pulse * 0.12
            );


        const peak =
            this.peakIntensity *
            this.intensity;


        ctx.save();


        // =====================================================
        // HALO
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
        // GLITCH REAL DA IMAGEM
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

            // Apenas uma aura muito discreta.
            const flashGradient =
                ctx.createRadialGradient(
                    cx,
                    cy,
                    0,
                    cx,
                    cy,
                    baseSize * 0.42
                );


            flashGradient.addColorStop(
                0,
                `rgba(255, 130, 40, ${
                    this.flash *
                    this.intensity *
                    0.30
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
        // =====================================================

        this._drawEnergyRays(
            ctx,
            cx,
            cy,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        ctx.restore();

    }


    // =========================================================
    // HALO
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
        // RAIO MÁXIMO PERMITIDO PELO CANVAS
        //
        // Isso garante que o halo nunca saia do vídeo.
        // =====================================================

        const maxRadius =
            Math.min(
                cx - x,
                x + width - cx,
                cy - y,
                y + height - cy
            );


        if (
            maxRadius <= 0
        ) {

            return;

        }


        const radius =
            Math.min(
                maxRadius * 0.92,
                Math.min(
                    width,
                    height
                ) *
                (
                    0.28 +
                    intensity *
                    0.14
                )
            );


        const gradient =
            ctx.createRadialGradient(
                cx,
                cy,
                radius * 0.03,
                cx,
                cy,
                radius
            );


        const alpha =
            Math.min(
                this.config.maxGlow,
                0.16 +
                intensity *
                0.30 +
                peak *
                0.12
            );


        gradient.addColorStop(
            0,
            `rgba(255, 35, 10, ${
                alpha
            })`
        );


        gradient.addColorStop(
            0.28,
            `rgba(255, 70, 15, ${
                alpha * 0.72
            })`
        );


        gradient.addColorStop(
            0.62,
            `rgba(210, 20, 5, ${
                alpha * 0.34
            })`
        );


        gradient.addColorStop(
            1,
            'rgba(100, 0, 0, 0)'
        );


        ctx.save();

        ctx.globalCompositeOperation =
            'screen';

        ctx.fillStyle =
            gradient;


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // =====================================================
        // SEGUNDO HALO MAIS FRACO
        // =====================================================

        const innerRadius =
            radius *
            0.58;


        const inner =
            ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                innerRadius
            );


        inner.addColorStop(
            0,
            `rgba(255, 110, 25, ${
                0.10 +
                intensity * 0.13
            })`
        );


        inner.addColorStop(
            1,
            'rgba(255, 30, 0, 0)'
        );


        ctx.fillStyle =
            inner;


        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            innerRadius,
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
            canvas.width !== drawWidth ||
            canvas.height !== drawHeight
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
        // GRADIENTE VERTICAL
        //
        // vermelho escuro
        // ↓
        // vermelho/laranja
        // ↓
        // laranja/amarelo
        // ↓
        // vermelho escuro
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
            'rgba(90, 0, 8, 0.52)'
        );


        gradient.addColorStop(
            0.18,
            'rgba(180, 8, 5, 0.38)'
        );


        gradient.addColorStop(
            0.42,
            'rgba(255, 55, 8, 0.48)'
        );


        gradient.addColorStop(
            0.60,
            'rgba(255, 105, 12, 0.55)'
        );


        gradient.addColorStop(
            0.76,
            'rgba(255, 55, 5, 0.40)'
        );


        gradient.addColorStop(
            1,
            'rgba(75, 0, 5, 0.48)'
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
        // NÚCLEO QUENTE
        // =====================================================

        const hot =
            flameCtx.createRadialGradient(
                canvas.width * 0.50,
                canvas.height * 0.48,
                0,
                canvas.width * 0.50,
                canvas.height * 0.48,
                Math.min(
                    canvas.width,
                    canvas.height
                ) * 0.48
            );


        hot.addColorStop(
            0,
            `rgba(255, 190, 35, ${
                0.18 +
                intensity * 0.12
            })`
        );


        hot.addColorStop(
            0.30,
            'rgba(255, 105, 12, 0.24)'
        );


        hot.addColorStop(
            0.68,
            'rgba(255, 25, 5, 0.10)'
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
        // RECORTA O GRADIENTE PELA SILHUETA REAL
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
        // DESENHA POR CIMA DA PESSOA
        // =====================================================

        ctx.save();

        ctx.globalCompositeOperation =
            'screen';


        ctx.globalAlpha =
            0.72;


        ctx.drawImage(
            canvas,
            drawX,
            drawY
        );


        ctx.restore();

    }


    // =========================================================
    // GLITCH REAL
    //
    // NÃO desenha barras coloridas.
    //
    // Ele pega pedaços da própria imagem segmentada
    // da pessoa e os desloca para fora.
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


            // Maioria dos glitches nasce perto do rosto.
            const radius =
                0.20 +
                Math.random() *
                0.34;


            const centerX =
                0.50 +
                Math.cos(angle) *
                radius *
                0.65;


            const centerY =
                0.45 +
                Math.sin(angle) *
                radius;


            const width =
                0.035 +
                Math.random() *
                0.12;


            const height =
                0.025 +
                Math.random() *
                0.10;


            // Deslocamento radial.
            const outward =
                0.025 +
                Math.random() *
                0.12;


            this.imageGlitches.push({

                x:
                    Math.max(
                        0,
                        Math.min(
                            1 - width,
                            centerX - width / 2
                        )
                    ),

                y:
                    Math.max(
                        0,
                        Math.min(
                            1 - height,
                            centerY - height / 2
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
                    0.08,

                alpha:
                    0.35 +
                    Math.random() *
                    0.45

            });

        }

    }


    // =========================================================
    // DESENHA GLITCH DA IMAGEM
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

            // Pequena oscilação.
            const jitter =
                (
                    Math.random() -
                    0.5
                ) *
                0.012 *
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
                glitch.width *
                sourceWidth;


            const sh =
                glitch.height *
                sourceHeight;


            const dx =
                drawX +
                (
                    glitch.x +
                    glitch.offsetX +
                    jitter
                ) *
                drawWidth;


            const dy =
                drawY +
                (
                    glitch.y +
                    glitch.offsetY +
                    jitter
                ) *
                drawHeight;


            const dw =
                glitch.width *
                drawWidth;


            const dh =
                glitch.height *
                drawHeight;


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


            // A própria imagem da pessoa.
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


            // Fagulhas maiores ficam alongadas
            // na direção do movimento.
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
    // RAIOS
    // =========================================================

    _drawEnergyRays(
        ctx,
        cx,
        cy,
        width,
        height,
        intensity,
        peak
    ) {

        const count =
            Math.floor(
                12 +
                intensity *
                (
                    this.config.rayCount -
                    12
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
                Math.sin(
                    this.time * 0.004 +
                    i * 1.7
                ) *
                0.055;


            // Vibração individual.
            const vibration =
                Math.sin(
                    this.time * 0.045 +
                    i * 2.13
                ) *
                base *
                0.012 *
                intensity;


            const startRadius =
                base *
                (
                    0.24 +
                    Math.sin(
                        i * 4.1
                    ) *
                    0.015
                );


            const length =
                base *
                (
                    0.075 +
                    intensity *
                    this.config.rayLength +
                    peak *
                    0.045
                );


            const sx =
                cx +
                Math.cos(angle) *
                startRadius;


            const sy =
                cy +
                Math.sin(angle) *
                startRadius;


            const ex =
                sx +
                Math.cos(angle) *
                (
                    length +
                    vibration
                );


            const ey =
                sy +
                Math.sin(angle) *
                (
                    length +
                    vibration
                );


            const alpha =
                0.28 +
                intensity *
                0.45 +
                peak *
                0.18;


            ctx.lineWidth =
                this.config.rayWidth +
                intensity *
                1.8;


            ctx.strokeStyle =
                `rgba(255, ${
                    45 +
                    Math.floor(
                        intensity * 100
                    )
                }, 20, ${
                    Math.min(
                        0.9,
                        alpha
                    )
                })`;


            ctx.beginPath();

            ctx.moveTo(
                sx,
                sy
            );


            // Pequena quebra no raio.
            const midX =
                (
                    sx +
                    ex
                ) / 2 +
                Math.cos(
                    angle + Math.PI / 2
                ) *
                vibration *
                2;


            const midY =
                (
                    sy +
                    ey
                ) / 2 +
                Math.sin(
                    angle + Math.PI / 2
                ) *
                vibration *
                2;


            ctx.lineTo(
                midX,
                midY
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
    // CRIA FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                8 +
                this.intensity *
                16
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
                55 +
                Math.random() *
                105;


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
    // CRIA MUITAS PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                18 +
                this.intensity *
                30
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


            const angle =
                Math.random() *
                Math.PI *
                2;


            // Origem mais próxima do rosto.
            const radius =
                35 +
                Math.random() *
                105;


            const speed =
                0.025 +
                Math.random() *
                0.13;


            const fire =
                Math.random();


            let color;


            if (
                fire < 0.22
            ) {

                color =
                    '#fff06a';

            } else if (
                fire < 0.52
            ) {

                color =
                    '#ffb52e';

            } else if (
                fire < 0.80
            ) {

                color =
                    '#ff6a16';

            } else {

                color =
                    '#ff3030';

            }


            this.particles.push({

                x:
                    Math.cos(angle) *
                    radius,

                y:
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
                    3.8,

                stretch:
                    1.2 +
                    Math.random() *
                    2.5,

                alpha:
                    0.55 +
                    Math.random() *
                    0.45,

                life:
                    450 +
                    Math.random() *
                    1100,

                maxLife:
                    1550,

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
            r < 0.20
        ) {

            return '#fff06a';

        }


        if (
            r < 0.45
        ) {

            return '#ffb52e';

        }


        if (
            r < 0.72
        ) {

            return '#ff6818';

        }


        return '#ff2020';

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

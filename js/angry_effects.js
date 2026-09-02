// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - tensão visual
// - pulsação vermelha
// - distorção/glitch
// - fragmentação holográfica
// - partículas energéticas
// - rachaduras digitais
// - picos de raiva
// - flashes rápidos
//
// Não altera a detecção de emoções.
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

            // Pulsação
            pulseSpeed: 0.008,

            // Brilho geral
            maxGlow: 0.75,

            // Glitches
            glitchIntervalMin: 220,
            glitchIntervalMax: 700,
            glitchDuration: 90,

            // Picos
            peakIntervalMin: 900,
            peakIntervalMax: 2200,

            // Fragmentos
            maxFragments: 35,

            // Partículas
            maxParticles: 45,

            // Energia ao redor da cabeça
            crackCount: 10

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

        this.flash = 0;

        // =====================================================
        // PULSO VISUAL
        // =====================================================

        this.pulse = 0;

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
            confidence || 0;


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
                            0.30
                        ) / 0.70
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
                    delta,
                    100
                )
            );


        // =====================================================
        // SUAVIZA INTENSIDADE
        // =====================================================

        const smoothing =
            this.targetIntensity >
            this.intensity
                ? 0.12
                : 0.055;


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
        // PULSO
        // =====================================================

        this.pulse =
            (
                Math.sin(
                    this.time *
                    this.config.pulseSpeed
                ) +
                1
            ) / 2;


        // =====================================================
        // GLITCH
        // =====================================================

        if (
            this.intensity > 0.04
        ) {

            this.glitchTimer += dt;

            if (
                this.glitchTimer >=
                this.nextGlitch
            ) {

                this.glitchRemaining =
                    this.config.glitchDuration *
                    (
                        0.8 +
                        this.intensity *
                        0.9
                    );

                this.glitchTimer = 0;

                this.nextGlitch =
                    this._random(
                        this.config.glitchIntervalMin,
                        this.config.glitchIntervalMax
                    ) *
                    (
                        1.15 -
                        this.intensity *
                        0.40
                    );

            }

        } else {

            this.glitchTimer = 0;

            this.glitchRemaining = 0;

        }


        if (
            this.glitchRemaining > 0
        ) {

            this.glitchRemaining -= dt;

        }


        // =====================================================
        // PICO DE RAIVA
        // =====================================================

        if (
            this.intensity > 0.15
        ) {

            this.peakTimer += dt;

            if (
                this.peakTimer >=
                this.nextPeak
            ) {

                this.peakTimer = 0;

                this.peakIntensity =
                    0.7 +
                    Math.random() *
                    0.3;


                this.flash =
                    0.35 +
                    Math.random() *
                    0.35;


                this._spawnPeakFragments();

                this._spawnPeakParticles();


                this.nextPeak =
                    this._random(
                        this.config.peakIntervalMin,
                        this.config.peakIntervalMax
                    ) /
                    (
                        0.75 +
                        this.intensity *
                        0.55
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
                0.88,
                dt / 16.67
            );


        // =====================================================
        // DECAY DO FLASH
        // =====================================================

        this.flash *=
            Math.pow(
                0.78,
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
                fragment.vx *
                dt;


            fragment.y +=
                fragment.vy *
                dt;


            fragment.rotation +=
                fragment.rotationSpeed *
                dt;


            fragment.vx *=
                Math.pow(
                    0.995,
                    dt
                );


            fragment.vy *=
                Math.pow(
                    0.995,
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
                particle.vx *
                dt;


            particle.y +=
                particle.vy *
                dt;


            particle.vx *=
                Math.pow(
                    0.996,
                    dt
                );


            particle.vy *=
                Math.pow(
                    0.996,
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
        // LIMPEZA AO SAIR DO ANGRY
        // =====================================================

        if (
            this.intensity < 0.01 &&
            this.targetIntensity <= 0
        ) {

            this.fragments.length = 0;

            this.particles.length = 0;

            this.peakIntensity = 0;

            this.flash = 0;

        }

    }


    // =========================================================
    // DRAW
    // =========================================================

    draw(
        ctx,
        options
    ) {

        if (
            !ctx ||
            !options
        ) {

            return;

        }


        const {

            drawX = 0,
            drawY = 0,
            drawWidth = ctx.canvas.width,
            drawHeight = ctx.canvas.height

        } = options;


        if (
            this.intensity < 0.01
        ) {

            return;

        }


        // =====================================================
        // CENTRO DA CABEÇA
        // =====================================================

        const cx =
            drawX +
            drawWidth / 2;


        const cy =
            drawY +
            drawHeight * 0.43;


        // =====================================================
        // TENSÃO
        // =====================================================

        const pulse =
            this.pulse;


        const tension =
            this.intensity *
            (
                0.70 +
                pulse * 0.30
            );


        const peak =
            this.peakIntensity *
            this.intensity;


        ctx.save();


        // =====================================================
        // COMPOSIÇÃO
        // =====================================================

        ctx.globalCompositeOperation =
            'screen';


        // =====================================================
        // 1. HALO VERMELHO
        // =====================================================

        this._drawHalo(
            ctx,
            cx,
            cy,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        // =====================================================
        // 2. PULSO EXTERNO
        // =====================================================

        this._drawPulseRing(
            ctx,
            cx,
            cy,
            drawWidth,
            drawHeight,
            tension
        );


        // =====================================================
        // 3. FLASH
        // =====================================================

        if (
            this.flash > 0.01
        ) {

            ctx.fillStyle =
                `rgba(
                    255,
                    25,
                    25,
                    ${
                        this.flash *
                        this.intensity *
                        0.20
                    }
                )`;


            ctx.fillRect(
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );

        }


        // =====================================================
        // 4. GLITCH
        // =====================================================

        if (
            this.glitchRemaining > 0
        ) {

            this._drawGlitch(
                ctx,
                drawX,
                drawY,
                drawWidth,
                drawHeight,
                tension
            );

        }


        // =====================================================
        // 5. RACHADURAS
        // =====================================================

        this._drawEnergyCracks(
            ctx,
            cx,
            cy,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        // =====================================================
        // 6. FRAGMENTOS
        // =====================================================

        this._drawFragments(
            ctx,
            tension,
            drawX,
            drawY
        );


        // =====================================================
        // 7. PARTÍCULAS
        // =====================================================

        this._drawParticles(
            ctx,
            tension,
            drawX,
            drawY
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
        width,
        height,
        intensity,
        peak
    ) {

        const radius =
            Math.min(
                width,
                height
            ) *
            (
                0.30 +
                intensity * 0.15
            );


        const gradient =
            ctx.createRadialGradient(
                cx,
                cy,
                radius * 0.05,
                cx,
                cy,
                radius
            );


        gradient.addColorStop(
            0,
            `rgba(
                255,
                15,
                15,
                ${
                    0.10 +
                    intensity * 0.15 +
                    peak * 0.12
                }
            )`
        );


        gradient.addColorStop(
            0.35,
            `rgba(
                230,
                0,
                0,
                ${
                    0.08 +
                    intensity * 0.10
                }
            )`
        );


        gradient.addColorStop(
            0.70,
            `rgba(
                150,
                0,
                0,
                ${
                    0.035 +
                    intensity * 0.07
                }
            )`
        );


        gradient.addColorStop(
            1,
            'rgba(100, 0, 0, 0)'
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            cx - radius,
            cy - radius,
            radius * 2,
            radius * 2
        );

    }


    // =========================================================
    // PULSO EXTERNO
    // =========================================================

    _drawPulseRing(
        ctx,
        cx,
        cy,
        width,
        height,
        intensity
    ) {

        const base =
            Math.min(
                width,
                height
            );


        const radius =
            base *
            (
                0.28 +
                this.pulse * 0.035
            );


        ctx.beginPath();


        ctx.arc(
            cx,
            cy,
            radius,
            0,
            Math.PI * 2
        );


        ctx.lineWidth =
            1 +
            intensity * 2;


        ctx.strokeStyle =
            `rgba(
                255,
                25,
                25,
                ${
                    0.10 +
                    intensity * 0.16
                }
            )`;


        ctx.stroke();

    }


    // =========================================================
    // GLITCH
    // =========================================================

    _drawGlitch(
        ctx,
        x,
        y,
        width,
        height,
        intensity
    ) {

        const number =
            Math.floor(
                4 +
                intensity * 9
            );


        for (
            let i = 0;
            i < number;
            i++
        ) {

            const barHeight =
                2 +
                Math.random() *
                Math.max(
                    3,
                    height * 0.025
                );


            const barY =
                y +
                Math.random() *
                height;


            const offset =
                (
                    Math.random() -
                    0.5
                ) *
                width *
                0.12 *
                intensity;


            const alpha =
                0.18 +
                Math.random() *
                0.30;


            ctx.fillStyle =
                `rgba(
                    255,
                    20,
                    20,
                    ${alpha}
                )`;


            ctx.fillRect(
                x + offset,
                barY,
                width,
                barHeight
            );


            // Pequeno segundo deslocamento
            // para dar aparência digital

            if (
                Math.random() >
                0.45
            ) {

                ctx.fillStyle =
                    `rgba(
                        255,
                        100,
                        100,
                        ${alpha * 0.65}
                    )`;


                ctx.fillRect(
                    x +
                    offset +
                    (
                        Math.random() -
                        0.5
                    ) *
                    width *
                    0.08,

                    barY +
                    barHeight +
                    1,

                    width *
                    (
                        0.15 +
                        Math.random() *
                        0.45
                    ),

                    2
                );

            }

        }

    }


    // =========================================================
    // RACHADURAS
    // =========================================================

    _drawEnergyCracks(
        ctx,
        cx,
        cy,
        width,
        height,
        intensity,
        peak
    ) {

        const base =
            Math.min(
                width,
                height
            );


        const count =
            Math.floor(
                5 +
                intensity *
                this.config.crackCount
            );


        ctx.save();


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const angle =
                (
                    Math.PI * 2 *
                    i /
                    count
                ) +
                Math.sin(
                    this.time *
                    0.002 +
                    i
                ) *
                0.10;


            const startRadius =
                base *
                (
                    0.22 +
                    Math.random() *
                    0.08
                );


            const length =
                base *
                (
                    0.045 +
                    intensity * 0.075 +
                    peak * 0.06
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
                length;


            const ey =
                sy +
                Math.sin(angle) *
                length;


            ctx.beginPath();


            ctx.moveTo(
                sx,
                sy
            );


            const mx =
                (
                    sx +
                    ex
                ) / 2 +
                (
                    Math.random() -
                    0.5
                ) *
                length *
                0.55;


            const my =
                (
                    sy +
                    ey
                ) / 2 +
                (
                    Math.random() -
                    0.5
                ) *
                length *
                0.55;


            ctx.lineTo(
                mx,
                my
            );


            ctx.lineTo(
                ex,
                ey
            );


            ctx.lineWidth =
                1 +
                intensity * 1.8;


            ctx.strokeStyle =
                `rgba(
                    255,
                    35,
                    35,
                    ${
                        0.16 +
                        intensity * 0.20 +
                        peak * 0.18
                    }
                )`;


            ctx.stroke();

        }


        ctx.restore();

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

            const life =
                Math.max(
                    0,
                    Math.min(
                        1,
                        fragment.life /
                        fragment.maxLife
                    )
                );


            const alpha =
                life *
                intensity *
                0.95;


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


            ctx.shadowBlur =
                8;


            ctx.shadowColor =
                '#ff2020';


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
    // PARTÍCULAS
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
                intensity;


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                particle.color;


            ctx.shadowBlur =
                7;


            ctx.shadowColor =
                '#ff3030';


            ctx.fillRect(
                drawX +
                particle.x,
                drawY +
                particle.y,
                particle.size,
                particle.size
            );

        }


        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;

    }


    // =========================================================
    // CRIA FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                8 +
                this.intensity * 14
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
                95;


            const speed =
                0.045 +
                Math.random() *
                0.16;


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
                    3 +
                    Math.random() * 10,

                height:
                    1 +
                    Math.random() * 4,

                rotation:
                    Math.random() *
                    Math.PI,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.018,

                life:
                    450 +
                    Math.random() *
                    850,

                maxLife:
                    1300,

                color:
                    Math.random() > 0.30
                        ? '#ff2020'
                        : '#ff7777'

            });

        }

    }


    // =========================================================
    // CRIA PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                8 +
                this.intensity * 14
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


            const radius =
                35 +
                Math.random() *
                110;


            const speed =
                0.045 +
                Math.random() *
                0.13;


            this.particles.push({

                x:
                    Math.cos(angle) *
                    radius,

                y:
                    Math.sin(angle) *
                    radius *
                    0.85,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    1.5 +
                    Math.random() * 3.5,

                life:
                    350 +
                    Math.random() *
                    750,

                maxLife:
                    1100,

                color:
                    Math.random() > 0.25
                        ? '#ff3030'
                        : '#ffaaaa'

            });

        }

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

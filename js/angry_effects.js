// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - imagem holográfica sofrendo glitch
// - tensão vermelha
// - halo contido
// - partículas agressivas
// - fragmentação digital
// - olhos vermelhos / lasers
// - picos de raiva
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

        this.pulse = 0;

        // =====================================================
        // CONFIGURAÇÃO
        // =====================================================

        this.config = {

            pulseSpeed: 0.009,

            // Halo
            maxGlow: 0.70,

            // Glitches
            glitchIntervalMin: 180,
            glitchIntervalMax: 600,
            glitchDuration: 110,

            // Picos
            peakIntervalMin: 750,
            peakIntervalMax: 1800,

            // Partículas
            maxFragments: 60,
            maxParticles: 90,

            // Olhos
            eyeGlow: 0.95,

            // Lasers
            laserLength: 0.16,

            // intensidade mínima para os olhos
            eyeThreshold: 0.15

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
        // CANVAS TEMPORÁRIO PARA GLITCH
        // =====================================================

        this._glitchCanvas =
            document.createElement('canvas');

        this._glitchCtx =
            this._glitchCanvas.getContext(
                '2d'
            );

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
                ? 0.13
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
                        1.1
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
                        0.45
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
                    0.70 +
                    Math.random() *
                    0.30;


                this.flash =
                    0.30 +
                    Math.random() *
                    0.45;


                this._spawnPeakFragments();

                this._spawnPeakParticles();


                this.nextPeak =
                    this._random(
                        this.config.peakIntervalMin,
                        this.config.peakIntervalMax
                    ) /
                    (
                        0.70 +
                        this.intensity *
                        0.65
                    );

            }

        } else {

            this.peakTimer = 0;

        }


        // =====================================================
        // DECAY
        // =====================================================

        this.peakIntensity *=
            Math.pow(
                0.88,
                dt / 16.67
            );


        this.flash *=
            Math.pow(
                0.76,
                dt / 16.67
            );


        // =====================================================
        // FRAGMENTOS
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
        // PARTÍCULAS
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
        // LIMPEZA
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

            drawWidth =
                ctx.canvas.width,

            drawHeight =
                ctx.canvas.height,

            frameX = 0,
            frameY = 0,

            scaleX = 1,
            scaleY = 1,

            landmarks = null

        } = options;


        if (
            this.intensity < 0.01
        ) {

            return;

        }


        // =====================================================
        // CENTRO
        // =====================================================

        const cx =
            drawX +
            drawWidth / 2;


        const cy =
            drawY +
            drawHeight * 0.43;


        const tension =
            this.intensity *
            (
                0.72 +
                this.pulse *
                0.28
            );


        const peak =
            this.peakIntensity *
            this.intensity;


        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        // =====================================================
        // 1. HALO CONTIDO
        // =====================================================

        this._drawHalo(
            ctx,
            drawX,
            drawY,
            drawWidth,
            drawHeight,
            tension,
            peak
        );


        // =====================================================
        // 2. OLHOS VERMELHOS / LASERS
        // =====================================================

        if (
            landmarks &&
            this.intensity >=
                this.config.eyeThreshold
        ) {

            this._drawLaserEyes(
                ctx,
                landmarks,
                {
                    frameX,
                    frameY,
                    drawX,
                    drawY,
                    scaleX,
                    scaleY,
                    drawWidth,
                    drawHeight
                },
                tension,
                peak
            );

        }


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
                        0.16
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
        // 4. GLITCH DA PRÓPRIA IMAGEM
        // =====================================================

        if (
            this.glitchRemaining > 0
        ) {

            this._drawImageGlitch(
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
        x,
        y,
        width,
        height,
        intensity,
        peak
    ) {

        // O halo fica explicitamente dentro
        // do retângulo da câmera.

        const radius =
            Math.min(
                width,
                height
            ) *
            (
                0.18 +
                intensity * 0.08
            );


        const cx =
            x +
            width / 2;


        const cy =
            y +
            height * 0.43;


        const gradient =
            ctx.createRadialGradient(
                cx,
                cy,
                0,
                cx,
                cy,
                radius
            );


        gradient.addColorStop(
            0,
            `rgba(
                255,
                10,
                10,
                ${
                    0.10 +
                    intensity * 0.15 +
                    peak * 0.12
                }
            )`
        );


        gradient.addColorStop(
            0.40,
            `rgba(
                220,
                0,
                0,
                ${
                    0.07 +
                    intensity * 0.10
                }
            )`
        );


        gradient.addColorStop(
            0.75,
            `rgba(
                130,
                0,
                0,
                ${
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
            x,
            y,
            width,
            height
        );

    }


    // =========================================================
    // OLHOS / LASERS
    // =========================================================

    _drawLaserEyes(
        ctx,
        landmarks,
        transform,
        intensity,
        peak
    ) {

        const positions =
            landmarks.positions ||
            landmarks;


        if (
            !positions ||
            positions.length < 48
        ) {

            return;

        }


        // face-api.js:
        //
        // olho esquerdo:
        // 36 - 41
        //
        // olho direito:
        // 42 - 47

        const leftEye =
            this._getEyeCenter(
                positions,
                36,
                41
            );


        const rightEye =
            this._getEyeCenter(
                positions,
                42,
                47
            );


        if (
            !leftEye ||
            !rightEye
        ) {

            return;

        }


        const left =
            this._transformPoint(
                leftEye,
                transform
            );


        const right =
            this._transformPoint(
                rightEye,
                transform
            );


        // =====================================================
        // DIREÇÃO DOS LASERS
        //
        // Cada laser aponta para fora do rosto.
        // =====================================================

        const faceCenterX =
            (
                left.x +
                right.x
            ) / 2;


        this._drawSingleLaserEye(
            ctx,
            left,
            left.x < faceCenterX
                ? -1
                : 1,
            transform,
            intensity,
            peak
        );


        this._drawSingleLaserEye(
            ctx,
            right,
            right.x < faceCenterX
                ? -1
                : 1,
            transform,
            intensity,
            peak
        );

    }


    // =========================================================
    // OLHO INDIVIDUAL
    // =========================================================

    _drawSingleLaserEye(
        ctx,
        eye,
        direction,
        transform,
        intensity,
        peak
    ) {

        const width =
            transform.drawWidth;


        const height =
            transform.drawHeight;


        const base =
            Math.min(
                width,
                height
            );


        // =====================================================
        // GLOW
        // =====================================================

        const glowRadius =
            base *
            (
                0.025 +
                intensity * 0.018
            );


        const gradient =
            ctx.createRadialGradient(
                eye.x,
                eye.y,
                0,
                eye.x,
                eye.y,
                glowRadius
            );


        gradient.addColorStop(
            0,
            `rgba(
                255,
                255,
                255,
                ${
                    0.75 +
                    intensity * 0.20
                }
            )`
        );


        gradient.addColorStop(
            0.18,
            `rgba(
                255,
                30,
                30,
                ${
                    0.90 +
                    peak * 0.08
                }
            )`
        );


        gradient.addColorStop(
            0.50,
            `rgba(
                255,
                0,
                0,
                ${
                    0.40 +
                    intensity * 0.35
                }
            )`
        );


        gradient.addColorStop(
            1,
            'rgba(255, 0, 0, 0)'
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            eye.x - glowRadius,
            eye.y - glowRadius,
            glowRadius * 2,
            glowRadius * 2
        );


        // =====================================================
        // NÚCLEO DO OLHO
        // =====================================================

        ctx.beginPath();


        ctx.arc(
            eye.x,
            eye.y,
            base *
            (
                0.008 +
                intensity * 0.005
            ),
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            `rgba(
                255,
                20,
                20,
                ${
                    0.90 +
                    peak * 0.10
                }
            )`;


        ctx.shadowBlur =
            14;


        ctx.shadowColor =
            '#ff0000';


        ctx.fill();


        // =====================================================
        // LASER PRINCIPAL
        // =====================================================

        const laserLength =
            base *
            (
                this.config.laserLength +
                intensity * 0.10
            );


        const endX =
            eye.x +
            direction *
            laserLength;


        ctx.beginPath();


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            endX,
            eye.y
        );


        ctx.lineWidth =
            0.8 +
            intensity * 1.6;


        ctx.strokeStyle =
            `rgba(
                255,
                25,
                25,
                ${
                    0.40 +
                    intensity * 0.45 +
                    peak * 0.15
                }
            )`;


        ctx.shadowBlur =
            10;


        ctx.shadowColor =
            '#ff0000';


        ctx.stroke();


        // =====================================================
        // FEIXE SECUNDÁRIO
        // =====================================================

        ctx.beginPath();


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            endX,
            eye.y +
            (
                this.pulse -
                0.5
            ) *
            4
        );


        ctx.lineWidth =
            0.35 +
            intensity * 0.6;


        ctx.strokeStyle =
            `rgba(
                255,
                100,
                100,
                ${
                    0.20 +
                    intensity * 0.30
                }
            )`;


        ctx.stroke();


        ctx.shadowBlur = 0;

    }


    // =========================================================
    // OBTÉM CENTRO DO OLHO
    // =========================================================

    _getEyeCenter(
        positions,
        start,
        end
    ) {

        let x = 0;
        let y = 0;
        let count = 0;


        for (
            let i = start;
            i <= end;
            i++
        ) {

            if (
                !positions[i]
            ) {

                continue;

            }


            x +=
                positions[i].x;

            y +=
                positions[i].y;

            count++;

        }


        if (
            count === 0
        ) {

            return null;

        }


        return {

            x: x / count,
            y: y / count

        };

    }


    // =========================================================
    // TRANSFORMA LANDMARK
    // =========================================================

    _transformPoint(
        point,
        transform
    ) {

        return {

            x:
                transform.drawX +
                (
                    point.x -
                    transform.frameX
                ) *
                transform.scaleX,

            y:
                transform.drawY +
                (
                    point.y -
                    transform.frameY
                ) *
                transform.scaleY

        };

    }


    // =========================================================
    // GLITCH REAL DA IMAGEM
    // =========================================================

    _drawImageGlitch(
        ctx,
        x,
        y,
        width,
        height,
        intensity
    ) {

        const canvas =
            ctx.canvas;


        const temp =
            this._glitchCanvas;


        const tempCtx =
            this._glitchCtx;


        const w =
            Math.max(
                1,
                Math.floor(width)
            );


        const h =
            Math.max(
                1,
                Math.floor(height)
            );


        // =====================================================
        // REDIMENSIONA BUFFER
        // =====================================================

        if (
            temp.width !== w ||
            temp.height !== h
        ) {

            temp.width = w;

            temp.height = h;

        }


        tempCtx.clearRect(
            0,
            0,
            w,
            h
        );


        // Copia SOMENTE a imagem da câmera.

        tempCtx.drawImage(
            canvas,
            x,
            y,
            width,
            height,
            0,
            0,
            w,
            h
        );


        // =====================================================
        // NÚMERO DE FAIXAS
        // =====================================================

        const slices =
            Math.floor(
                5 +
                intensity * 10
            );


        for (
            let i = 0;
            i < slices;
            i++
        ) {

            const sliceY =
                Math.random() *
                h;


            const sliceHeight =
                2 +
                Math.random() *
                Math.max(
                    4,
                    h * 0.035
                );


            const shift =
                (
                    Math.random() -
                    0.5
                ) *
                width *
                (
                    0.04 +
                    intensity * 0.12
                );


            // =================================================
            // COPIA FAIXA DESLOCADA
            // =================================================

            ctx.drawImage(
                temp,

                0,
                sliceY,
                w,
                sliceHeight,

                x + shift,
                y + sliceY,
                width,
                sliceHeight
            );


            // =================================================
            // LINHA DE INTERFERÊNCIA
            // =================================================

            if (
                Math.random() >
                0.35
            ) {

                ctx.fillStyle =
                    `rgba(
                        255,
                        20,
                        20,
                        ${
                            0.10 +
                            Math.random() *
                            0.25
                        }
                    )`;


                ctx.fillRect(
                    x + shift,
                    y + sliceY,
                    width *
                    (
                        0.20 +
                        Math.random() *
                        0.80
                    ),
                    1 +
                    Math.random() * 2
                );

            }

        }


        // =====================================================
        // LINHAS FINAS DE TV
        // =====================================================

        const scanlines =
            Math.floor(
                3 +
                intensity * 5
            );


        for (
            let i = 0;
            i < scanlines;
            i++
        ) {

            const sy =
                y +
                Math.random() *
                height;


            ctx.fillStyle =
                `rgba(
                    255,
                    40,
                    40,
                    ${
                        0.06 +
                        intensity * 0.10
                    }
                )`;


            ctx.fillRect(
                x,
                sy,
                width,
                1
            );

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
                4 +
                intensity * 8
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
                0.12;


            const startRadius =
                base *
                (
                    0.20 +
                    Math.random() *
                    0.06
                );


            const length =
                base *
                (
                    0.035 +
                    intensity * 0.065 +
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
                0.60;


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
                0.60;


            ctx.lineTo(
                mx,
                my
            );


            ctx.lineTo(
                ex,
                ey
            );


            ctx.lineWidth =
                0.8 +
                intensity * 1.5;


            ctx.strokeStyle =
                `rgba(
                    255,
                    30,
                    30,
                    ${
                        0.12 +
                        intensity * 0.22 +
                        peak * 0.15
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
                8;


            ctx.shadowColor =
                '#ff2020';


            // =================================================
            // RASTRO
            // =================================================

            if (
                particle.trail
            ) {

                ctx.fillRect(
                    drawX +
                    particle.x -
                    particle.vx *
                    5,

                    drawY +
                    particle.y -
                    particle.vy *
                    5,

                    particle.size *
                    0.6,

                    particle.size *
                    0.6
                );

            }


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
    // SPAWN FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                14 +
                this.intensity * 22
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
                30 +
                Math.random() *
                90;


            const speed =
                0.07 +
                Math.random() *
                0.22;


            this.fragments.push({

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
                    speed,

                width:
                    3 +
                    Math.random() * 12,

                height:
                    1 +
                    Math.random() * 5,

                rotation:
                    Math.random() *
                    Math.PI,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.022,

                life:
                    400 +
                    Math.random() *
                    900,

                maxLife:
                    1300,

                color:
                    Math.random() >
                    0.25
                        ? '#ff2020'
                        : '#ff8080'

            });

        }

    }


    // =========================================================
    // SPAWN PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                15 +
                this.intensity * 25
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
                20 +
                Math.random() *
                100;


            const speed =
                0.07 +
                Math.random() *
                0.20;


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
                    Math.random() * 4,

                trail:
                    true,

                life:
                    350 +
                    Math.random() *
                    800,

                maxLife:
                    1150,

                color:
                    Math.random() >
                    0.20
                        ? '#ff3030'
                        : '#ffb0b0'

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

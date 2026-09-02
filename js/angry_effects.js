// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// EFEITOS:
// - Glitch aplicado na própria imagem segmentada da pessoa
// - Halo vermelho pequeno e contido
// - Olhos vermelhos
// - Lasers saindo dos olhos
// - Partículas agressivas
// - Fragmentos digitais
// - Picos de raiva
// - Pequenos flashes vermelhos
//
// IMPORTANTE:
// O glitch NÃO é desenhado no quadro preto.
// Ele deve ser aplicado sobre this._personCanvas,
// que já contém a pessoa segmentada.
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

        this.peakIntensity = 0;
        this.flash = 0;

        // =====================================================
        // CONFIGURAÇÃO
        // =====================================================

        this.config = {

            // Pulso
            pulseSpeed: 0.009,

            // -------------------------------------------------
            // HALO
            //
            // Reduzido aproximadamente 50%.
            // -------------------------------------------------

            haloRadius: 0.09,

            // -------------------------------------------------
            // GLITCH
            // -------------------------------------------------

            glitchIntervalMin: 140,
            glitchIntervalMax: 430,
            glitchDuration: 115,

            // Quantidade de blocos de imagem deslocados
            glitchBlocksMin: 4,
            glitchBlocksMax: 11,

            // Intensidade máxima do deslocamento
            glitchDisplacement: 0.035,

            // -------------------------------------------------
            // PICOS
            // -------------------------------------------------

            peakIntervalMin: 600,
            peakIntervalMax: 1500,

            // -------------------------------------------------
            // PARTÍCULAS
            // -------------------------------------------------

            maxFragments: 90,
            maxParticles: 140,

            // -------------------------------------------------
            // OLHOS
            // -------------------------------------------------

            eyeThreshold: 0.10,

            // Comprimento do laser em relação ao quadro
            laserLength: 0.20

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
        // PICOS
        // =====================================================

        this.peakTimer = 0;

        this.nextPeak =
            this._random(
                this.config.peakIntervalMin,
                this.config.peakIntervalMax
            );

        // =====================================================
        // ELEMENTOS
        // =====================================================

        this.fragments = [];
        this.particles = [];

        // =====================================================
        // CANVAS TEMPORÁRIO
        //
        // Serve para copiar SOMENTE a área da pessoa.
        // =====================================================

        this._glitchCanvas =
            document.createElement('canvas');

        this._glitchCtx =
            this._glitchCanvas.getContext('2d');

        this._lastUpdateTime = 0;
    }


    // =========================================================
    // UTILITÁRIOS
    // =========================================================

    _random(min, max) {

        return (
            min +
            Math.random() *
            (max - min)
        );
    }


    _clamp(value, min, max) {

        return Math.max(
            min,
            Math.min(max, value)
        );
    }


    // =========================================================
    // DEFINE A EMOÇÃO
    // =========================================================

    setEmotion(
        emotion,
        confidence = 0
    ) {

        this.emotion =
            emotion || 'neutral';

        this.confidence =
            Number.isFinite(confidence)
                ? confidence
                : 0;


        if (
            this.emotion === 'angry'
        ) {

            this.targetIntensity =
                this._clamp(
                    (
                        this.confidence -
                        0.28
                    ) / 0.72,
                    0,
                    1
                );

        } else {

            this.targetIntensity = 0;
        }
    }


    // =========================================================
    // UPDATE
    // =========================================================

    update(delta = 16.67) {

        const dt =
            this._clamp(
                delta,
                0,
                100
            );

        // =====================================================
        // SUAVIZA INTENSIDADE
        // =====================================================

        const smoothing =
            this.targetIntensity >
            this.intensity
                ? 0.14
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
            this.intensity > 0.035
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
                        1.35
                    );


                this.glitchTimer = 0;


                this.nextGlitch =
                    this._random(
                        this.config.glitchIntervalMin,
                        this.config.glitchIntervalMax
                    ) *
                    (
                        1.10 -
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
            this.intensity > 0.12
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
                    0.25 +
                    Math.random() *
                    0.40;


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
                        0.75
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


        this.flash *=
            Math.pow(
                0.76,
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
    // GLITCH DA IMAGEM DA PESSOA
    //
    // sourceCanvas = _personCanvas
    //
    // O canvas já contém a máscara da pessoa.
    //
    // Portanto:
    //
    // NÃO desenhamos glitch no canvas final.
    // NÃO desenhamos barras sobre o quadro preto.
    //
    // Apenas deslocamos pedaços da própria imagem.
    // =========================================================

    drawGlitchedPerson(
        ctx,
        sourceCanvas,
        options = {}
    ) {

        if (
            !ctx ||
            !sourceCanvas
        ) {

            return false;
        }


        if (
            this.intensity < 0.035 ||
            this.glitchRemaining <= 0
        ) {

            return false;
        }


        const {
            sourceX = 0,
            sourceY = 0,
            sourceWidth =
                sourceCanvas.width,
            sourceHeight =
                sourceCanvas.height,

            drawX = 0,
            drawY = 0,

            drawWidth =
                ctx.canvas.width,

            drawHeight =
                ctx.canvas.height

        } = options;


        if (
            sourceWidth <= 0 ||
            sourceHeight <= 0 ||
            drawWidth <= 0 ||
            drawHeight <= 0
        ) {

            return false;
        }


        const w =
            Math.max(
                1,
                Math.round(drawWidth)
            );

        const h =
            Math.max(
                1,
                Math.round(drawHeight)
            );


        // =====================================================
        // PREPARA CANVAS
        // =====================================================

        const canvas =
            this._glitchCanvas;

        const buffer =
            this._glitchCtx;


        if (
            canvas.width !== w ||
            canvas.height !== h
        ) {

            canvas.width = w;
            canvas.height = h;
        }


        buffer.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );


        buffer.globalCompositeOperation =
            'copy';


        buffer.clearRect(
            0,
            0,
            w,
            h
        );


        // =====================================================
        // COPIA A PESSOA
        // =====================================================

        buffer.drawImage(
            sourceCanvas,

            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,

            0,
            0,
            w,
            h
        );


        // =====================================================
        // DESENHA IMAGEM NORMAL
        // =====================================================

        ctx.save();

        ctx.globalCompositeOperation =
            'source-over';


        ctx.drawImage(
            canvas,

            0,
            0,
            w,
            h,

            drawX,
            drawY,
            drawWidth,
            drawHeight
        );


        // =====================================================
        // ÁREA SEGURA
        //
        // Mantém uma margem para nunca atingir a borda
        // do retângulo preto.
        // =====================================================

        const marginX =
            drawWidth *
            0.045;

        const marginY =
            drawHeight *
            0.035;


        ctx.beginPath();

        ctx.rect(
            drawX + marginX,
            drawY + marginY,

            Math.max(
                1,
                drawWidth -
                marginX * 2
            ),

            Math.max(
                1,
                drawHeight -
                marginY * 2
            )
        );

        ctx.clip();


        // =====================================================
        // INTENSIDADE DO GLITCH
        // =====================================================

        const remaining =
            this._clamp(
                this.glitchRemaining /
                this.config.glitchDuration,
                0,
                1
            );


        const glitchStrength =
            (
                0.004 +
                this.intensity *
                this.config.glitchDisplacement +
                this.peakIntensity *
                0.012
            ) *
            (
                0.55 +
                remaining *
                0.45
            );


        // =====================================================
        // QUANTIDADE DE FRAGMENTOS DE IMAGEM
        // =====================================================

        const blockCount =
            Math.floor(
                this.config.glitchBlocksMin +
                this.intensity *
                (
                    this.config.glitchBlocksMax -
                    this.config.glitchBlocksMin
                )
            );


        // =====================================================
        // DESLOCAMENTO DOS BLOCOS
        // =====================================================

        for (
            let i = 0;
            i < blockCount;
            i++
        ) {

            const blockY =
                marginY +
                Math.random() *
                Math.max(
                    1,
                    drawHeight -
                    marginY * 2
                );


            const blockHeight =
                drawHeight *
                (
                    0.008 +
                    Math.random() *
                    0.038
                );


            const maxShift =
                drawWidth *
                glitchStrength;


            const shift =
                (
                    Math.random() *
                    2 -
                    1
                ) *
                maxShift;


            const sourceRelativeY =
                this._clamp(
                    blockY,
                    0,
                    drawHeight -
                    blockHeight
                );


            const sourceBlockHeight =
                Math.max(
                    1,
                    Math.round(
                        blockHeight *
                        h /
                        drawHeight
                    )
                );


            ctx.globalAlpha =
                0.45 +
                this.intensity *
                0.50;


            // -------------------------------------------------
            // O pedaço deslocado é retirado da própria imagem.
            // -------------------------------------------------

            ctx.drawImage(

                canvas,

                0,
                Math.round(
                    sourceRelativeY *
                    h /
                    drawHeight
                ),

                w,
                sourceBlockHeight,

                drawX +
                shift,

                drawY +
                sourceRelativeY,

                drawWidth,

                blockHeight
            );
        }


        ctx.globalAlpha = 1;

        ctx.restore();


        return true;
    }


    // =========================================================
    // DRAW DOS EFEITOS
    // =========================================================

    draw(
        ctx,
        options = {}
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
        // 1. HALO PEQUENO
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
        // 2. OLHOS E LASERS
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
        //
        // Também limitado ao retângulo da câmera.
        // =====================================================

        if (
            this.flash > 0.01
        ) {

            ctx.save();


            ctx.beginPath();

            ctx.rect(
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );

            ctx.clip();


            ctx.fillStyle =
                `rgba(
                    255,
                    20,
                    20,
                    ${
                        this.flash *
                        this.intensity *
                        0.10
                    }
                )`;


            ctx.fillRect(
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );


            ctx.restore();
        }


        // =====================================================
        // 4. RACHADURAS
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
        // 5. FRAGMENTOS
        // =====================================================

        this._drawFragments(
            ctx,
            tension,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );


        // =====================================================
        // 6. PARTÍCULAS
        // =====================================================

        this._drawParticles(
            ctx,
            tension,
            drawX,
            drawY,
            drawWidth,
            drawHeight
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

        const base =
            Math.min(
                width,
                height
            );


        // =====================================================
        // RAIO MUITO MENOR
        //
        // O valor antigo começava em 0.18.
        // Agora começa em 0.09.
        // =====================================================

        let radius =
            base *
            (
                this.config.haloRadius +
                intensity *
                0.018
            );


        // Segurança adicional.
        radius =
            Math.min(
                radius,

                width *
                0.20,

                height *
                0.20
            );


        let cx =
            x +
            width / 2;


        let cy =
            y +
            height *
            0.43;


        // =====================================================
        // GARANTE QUE O HALO FIQUE DENTRO DO QUADRO
        // =====================================================

        cx =
            this._clamp(
                cx,

                x + radius,

                x +
                width -
                radius
            );


        cy =
            this._clamp(
                cy,

                y + radius,

                y +
                height -
                radius
            );


        // =====================================================
        // GRADIENTE
        // =====================================================

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
                    0.08 +
                    intensity *
                    0.14 +
                    peak *
                    0.10
                }
            )`
        );


        gradient.addColorStop(
            0.35,

            `rgba(
                235,
                0,
                0,
                ${
                    0.05 +
                    intensity *
                    0.09
                }
            )`
        );


        gradient.addColorStop(
            0.70,

            `rgba(
                140,
                0,
                0,
                ${
                    intensity *
                    0.05
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


        // =====================================================
        // FACE-API 68 POINTS
        //
        // Olho esquerdo: 36-41
        // Olho direito: 42-47
        // =====================================================

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
        // CENTRO DOS OLHOS
        //
        // Usamos isso para determinar para qual lado
        // cada laser deve sair.
        // =====================================================

        const centerX =
            (
                left.x +
                right.x
            ) / 2;


        const leftDirection =
            left.x <
            centerX
                ? -1
                : 1;


        const rightDirection =
            right.x <
            centerX
                ? -1
                : 1;


        // =====================================================
        // LASER ESQUERDO
        // =====================================================

        this._drawSingleLaserEye(
            ctx,

            left,

            leftDirection,

            transform,

            intensity,
            peak
        );


        // =====================================================
        // LASER DIREITO
        // =====================================================

        this._drawSingleLaserEye(
            ctx,

            right,

            rightDirection,

            transform,

            intensity,
            peak
        );
    }


    // =========================================================
    // CENTRO DO OLHO
    // =========================================================

    _getEyeCenter(
        positions,
        start,
        end
    ) {

        if (
            !positions ||
            positions.length <= end
        ) {

            return null;
        }


        let x = 0;
        let y = 0;
        let count = 0;


        for (
            let i = start;
            i <= end;
            i++
        ) {

            const point =
                positions[i];


            if (
                !point ||
                !Number.isFinite(point.x) ||
                !Number.isFinite(point.y)
            ) {

                continue;
            }


            x += point.x;
            y += point.y;

            count++;
        }


        if (
            count === 0
        ) {

            return null;
        }


        return {

            x:
                x / count,

            y:
                y / count
        };
    }


    // =========================================================
    // CONVERTE COORDENADAS DO FACE-API
    // PARA O CANVAS FINAL
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
    // LASER INDIVIDUAL
    // =========================================================

    _drawSingleLaserEye(
        ctx,

        eye,

        direction,

        transform,

        intensity,
        peak
    ) {

        const base =
            Math.min(
                transform.drawWidth,
                transform.drawHeight
            );


        // =====================================================
        // GLOW
        // =====================================================

        const glowRadius =
            base *
            (
                0.020 +
                intensity *
                0.015
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
                    0.80 +
                    intensity *
                    0.15
                }
            )`
        );


        gradient.addColorStop(
            0.15,

            `rgba(
                255,
                40,
                40,
                ${
                    0.90 +
                    peak *
                    0.08
                }
            )`
        );


        gradient.addColorStop(
            0.48,

            `rgba(
                255,
                0,
                0,
                ${
                    0.45 +
                    intensity *
                    0.35
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
            eye.x -
            glowRadius,

            eye.y -
            glowRadius,

            glowRadius *
            2,

            glowRadius *
            2
        );


        // =====================================================
        // NÚCLEO VERMELHO
        // =====================================================

        const coreRadius =
            base *
            (
                0.006 +
                intensity *
                0.004
            );


        ctx.save();


        ctx.shadowBlur =
            10 +
            intensity *
            8;


        ctx.shadowColor =
            '#ff0000';


        ctx.beginPath();


        ctx.arc(
            eye.x,
            eye.y,
            coreRadius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            `rgba(
                255,
                20,
                20,
                ${
                    0.95 +
                    peak *
                    0.05
                }
            )`;


        ctx.fill();


        ctx.restore();


        // =====================================================
        // COMPRIMENTO
        // =====================================================

        const laserLength =
            base *
            (
                this.config.laserLength +
                intensity *
                0.13 +
                peak *
                0.05
            );


        const endX =
            eye.x +
            direction *
            laserLength;


        // Pequena vibração orgânica.
        const wobble =
            Math.sin(
                this.time *
                0.018 +
                eye.x *
                0.01
            ) *
            (
                0.5 +
                intensity *
                2
            );


        const endY =
            eye.y +
            wobble;


        // =====================================================
        // FEIXE PRINCIPAL
        // =====================================================

        ctx.save();


        ctx.shadowBlur =
            12 +
            intensity *
            10;


        ctx.shadowColor =
            'rgba(255, 0, 0, 0.95)';


        ctx.beginPath();


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            endX,
            endY
        );


        ctx.lineWidth =
            0.9 +
            intensity *
            2.0 +
            peak *
            0.7;


        ctx.strokeStyle =
            `rgba(
                255,
                15,
                15,
                ${
                    0.58 +
                    intensity *
                    0.38
                }
            )`;


        ctx.stroke();


        // =====================================================
        // NÚCLEO MAIS CLARO
        // =====================================================

        ctx.shadowBlur = 4;


        ctx.beginPath();


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            endX,
            endY
        );


        ctx.lineWidth =
            0.35 +
            intensity *
            0.75;


        ctx.strokeStyle =
            `rgba(
                255,
                180,
                180,
                ${
                    0.45 +
                    intensity *
                    0.40
                }
            )`;


        ctx.stroke();


        // =====================================================
        // DOIS RAIOS SECUNDÁRIOS
        // =====================================================

        const side =
            laserLength *
            0.72;


        const angle =
            direction < 0
                ? Math.PI
                : 0;


        const spread =
            0.075 +
            intensity *
            0.055;


        const ray1X =
            eye.x +
            Math.cos(
                angle - spread
            ) *
            side;


        const ray1Y =
            eye.y +
            Math.sin(
                angle - spread
            ) *
            side;


        const ray2X =
            eye.x +
            Math.cos(
                angle + spread
            ) *
            side;


        const ray2Y =
            eye.y +
            Math.sin(
                angle + spread
            ) *
            side;


        ctx.lineWidth =
            0.35 +
            intensity *
            0.55;


        ctx.strokeStyle =
            `rgba(
                255,
                45,
                45,
                ${
                    0.22 +
                    intensity *
                    0.30
                }
            )`;


        ctx.beginPath();


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            ray1X,
            ray1Y
        );


        ctx.moveTo(
            eye.x,
            eye.y
        );


        ctx.lineTo(
            ray2X,
            ray2Y
        );


        ctx.stroke();


        ctx.restore();
    }


    // =========================================================
    // RACHADURAS / ENERGIA
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

        const amount =
            2 +
            Math.floor(
                intensity *
                5 +
                peak *
                4
            );


        ctx.save();


        ctx.lineCap =
            'round';


        for (
            let i = 0;
            i < amount;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const length =
                Math.min(
                    width,
                    height
                ) *
                (
                    0.035 +
                    Math.random() *
                    0.08
                );


            let x = cx;
            let y = cy;


            ctx.beginPath();


            ctx.moveTo(
                x,
                y
            );


            const segments =
                2 +
                Math.floor(
                    Math.random() *
                    3
                );


            for (
                let j = 0;
                j < segments;
                j++
            ) {

                x +=
                    Math.cos(angle) *
                    length *
                    0.35 +
                    (
                        Math.random() -
                        0.5
                    ) *
                    10;


                y +=
                    Math.sin(angle) *
                    length *
                    0.35 +
                    (
                        Math.random() -
                        0.5
                    ) *
                    10;


                ctx.lineTo(
                    x,
                    y
                );
            }


            ctx.lineWidth =
                0.35 +
                intensity *
                0.9;


            ctx.strokeStyle =
                `rgba(
                    255,
                    30,
                    30,
                    ${
                        0.12 +
                        intensity *
                        0.25 +
                        peak *
                        0.18
                    }
                )`;


            ctx.shadowBlur =
                4 +
                peak *
                5;


            ctx.shadowColor =
                '#ff0000';


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
        drawY,
        drawWidth,
        drawHeight
    ) {

        const cx =
            drawX +
            drawWidth / 2;


        const cy =
            drawY +
            drawHeight * 0.43;


        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        for (
            const fragment
            of this.fragments
        ) {

            // Fragmentos são armazenados localmente
            // ao redor do centro.
            const x =
                cx +
                fragment.x;


            const y =
                cy +
                fragment.y;


            const alpha =
                this._clamp(
                    fragment.life /
                    fragment.maxLife,
                    0,
                    1
                ) *
                intensity;


            if (
                alpha <= 0
            ) {

                continue;
            }


            ctx.save();


            ctx.translate(
                x,
                y
            );


            ctx.rotate(
                fragment.rotation
            );


            ctx.globalAlpha =
                alpha;


            ctx.shadowBlur =
                5 +
                intensity *
                7;


            ctx.shadowColor =
                '#ff0000';


            ctx.fillStyle =
                `rgba(
                    255,
                    ${
                        20 +
                        Math.random() *
                        45
                    },
                    ${
                        20 +
                        Math.random() *
                        35
                    },
                    ${
                        0.30 +
                        intensity *
                        0.45
                    }
                )`;


            ctx.fillRect(
                -fragment.width / 2,
                -fragment.height / 2,
                fragment.width,
                fragment.height
            );


            ctx.restore();
        }


        ctx.restore();
    }


    // =========================================================
    // PARTÍCULAS
    // =========================================================

    _drawParticles(
        ctx,
        intensity,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    ) {

        const cx =
            drawX +
            drawWidth / 2;


        const cy =
            drawY +
            drawHeight * 0.43;


        ctx.save();


        ctx.globalCompositeOperation =
            'screen';


        for (
            const particle
            of this.particles
        ) {

            const x =
                cx +
                particle.x;


            const y =
                cy +
                particle.y;


            const alpha =
                this._clamp(
                    particle.life /
                    particle.maxLife,
                    0,
                    1
                ) *
                intensity;


            if (
                alpha <= 0
            ) {

                continue;
            }


            ctx.save();


            ctx.globalAlpha =
                alpha;


            ctx.shadowBlur =
                particle.size *
                (
                    2 +
                    intensity *
                    3
                );


            ctx.shadowColor =
                '#ff0000';


            ctx.fillStyle =
                `rgba(
                    255,
                    ${
                        30 +
                        Math.random() *
                        55
                    },
                    ${
                        20 +
                        Math.random() *
                        40
                    },
                    ${
                        0.35 +
                        intensity *
                        0.50
                    }
                )`;


            ctx.beginPath();


            ctx.arc(
                x,
                y,

                particle.size *
                (
                    0.65 +
                    this.pulse *
                    0.35
                ),

                0,
                Math.PI * 2
            );


            ctx.fill();


            ctx.restore();
        }


        ctx.restore();
    }


    // =========================================================
    // CRIA FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const count =
            10 +
            Math.floor(
                this.intensity *
                18
            );


        for (
            let i = 0;
            i < count;
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


            const distance =
                15 +
                Math.random() *
                95;


            const speed =
                0.025 +
                Math.random() *
                0.12;


            const maxLife =
                280 +
                Math.random() *
                700;


            this.fragments.push({

                x:
                    Math.cos(angle) *
                    distance,

                y:
                    Math.sin(angle) *
                    distance,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                width:
                    4 +
                    Math.random() *
                    20,

                height:
                    2 +
                    Math.random() *
                    9,

                rotation:
                    Math.random() *
                    Math.PI,

                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.006,

                life:
                    maxLife,

                maxLife
            });
        }
    }


    // =========================================================
    // CRIA PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const count =
            25 +
            Math.floor(
                this.intensity *
                40
            );


        for (
            let i = 0;
            i < count;
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
                10 +
                Math.random() *
                100;


            const speed =
                0.025 +
                Math.random() *
                0.14;


            const maxLife =
                350 +
                Math.random() *
                850;


            this.particles.push({

                x:
                    Math.cos(angle) *
                    radius,

                y:
                    Math.sin(angle) *
                    radius,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    1 +
                    Math.random() *
                    3.5,

                life:
                    maxLife,

                maxLife
            });
        }
    }
}

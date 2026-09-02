
// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - tensão
// - halo vermelho intenso
// - halo compacto e preso à cabeça
// - glitch da própria imagem segmentada
// - fragmentação da cabeça
// - partículas explosivas
// - partículas flutuantes
// - raios de energia
// - picos de raiva
//
// IMPORTANTE:
// Este módulo NÃO detecta emoções.
// Ele apenas recebe uma emoção + confiança.
//
// Compatível com:
// - detecção normal
// - modo carrossel
//
// NOVO:
// - Halo aproximadamente 40% menor
// - Halo e raios acompanham a cabeça
// - Efeito usa coordenadas da cabeça quando fornecidas
// ============================================================


export class AngryEffects {


    constructor() {

        // =====================================================
        // ESTADO
        // =====================================================

        this.emotion =
            'neutral';


        this.confidence =
            0;


        this.intensity =
            0;


        this.targetIntensity =
            0;


        this.time =
            performance.now();


        // =====================================================
        // CENTRO DO EFEITO
        //
        // Guarda a última posição conhecida da cabeça.
        // Isso evita saltos quando a detecção oscila.
        // =====================================================

        this.headX =
            null;


        this.headY =
            null;


        this.headRadius =
            null;


        this.headSmoothing =
            0.18;


        // =====================================================
        // CONFIGURAÇÃO
        // =====================================================

        this.config = {

            // -------------------------------------------------
            // Movimento muito mais lento.
            // -------------------------------------------------

            pulseSpeed:
                0.0018,


            // -------------------------------------------------
            // HALO
            // -------------------------------------------------

            maxGlow:
                0.88,


            // -------------------------------------------------
            // FRAGMENTOS GEOMÉTRICOS
            // -------------------------------------------------

            maxFragments:
                28,


            // -------------------------------------------------
            // PARTÍCULAS
            // -------------------------------------------------

            maxParticles:
                110,


            // -------------------------------------------------
            // GLITCH DA IMAGEM
            // -------------------------------------------------

            glitchIntervalMin:
                500,

            glitchIntervalMax:
                1300,


            glitchDuration:
                90,


            maxImageGlitches:
                22,


            // -------------------------------------------------
            // PICOS DE RAIVA
            // -------------------------------------------------

            peakIntervalMin:
                1500,

            peakIntervalMax:
                3300,


            // -------------------------------------------------
            // PARTÍCULAS CONTÍNUAS
            // -------------------------------------------------

            particleEmissionRate:
                0.075,


            // -------------------------------------------------
            // RAIOS
            // -------------------------------------------------

            rayCount:
                22

        };


        // =====================================================
        // GLITCH
        // =====================================================

        this.glitchTimer =
            0;


        this.nextGlitch =
            this._random(
                this.config.glitchIntervalMin,
                this.config.glitchIntervalMax
            );


        this.glitchRemaining =
            0;


        // =====================================================
        // GLITCH DA IMAGEM
        // =====================================================

        this.imageGlitches =
            [];


        // =====================================================
        // PICO
        // =====================================================

        this.peakTimer =
            0;


        this.nextPeak =
            this._random(
                this.config.peakIntervalMin,
                this.config.peakIntervalMax
            );


        this.peakIntensity =
            0;


        // =====================================================
        // FRAGMENTOS
        // =====================================================

        this.fragments =
            [];


        // =====================================================
        // PARTÍCULAS
        // =====================================================

        this.particles =
            [];


        this.particleEmissionAccumulator =
            0;


        // =====================================================
        // FLASH
        // =====================================================

        this.flash =
            0;

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


        // =====================================================
        // ANGRY
        // =====================================================

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

            this.targetIntensity =
                0;

        }

    }


    // =========================================================
    // UPDATE
    // =========================================================

    update(
        delta
    ) {

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

                ? 0.075

                : 0.035;


        this.intensity +=
            (
                this.targetIntensity -
                this.intensity
            ) *
            smoothing;


        // =====================================================
        // TEMPO
        // =====================================================

        this.time +=
            dt;


        // =====================================================
        // GLITCH
        // =====================================================

        if (
            this.intensity >
            0.08
        ) {

            this.glitchTimer +=
                dt;


            if (
                this.glitchTimer >=
                this.nextGlitch
            ) {

                this.glitchRemaining =
                    this.config.glitchDuration *
                    (
                        0.85 +
                        this.intensity *
                        0.45
                    );


                this.glitchTimer =
                    0;


                this.nextGlitch =
                    this._random(
                        this.config.glitchIntervalMin,
                        this.config.glitchIntervalMax
                    ) *
                    (
                        1.18 -
                        this.intensity *
                        0.25
                    );


                this._spawnImageGlitches();

            }

        } else {

            this.glitchTimer =
                0;


            this.glitchRemaining =
                0;

        }


        // =====================================================
        // DECAY DO GLITCH
        // =====================================================

        if (
            this.glitchRemaining >
            0
        ) {

            this.glitchRemaining -=
                dt;


            if (
                this.glitchRemaining <
                0
            ) {

                this.glitchRemaining =
                    0;

            }

        }


        // =====================================================
        // PICO DE RAIVA
        // =====================================================

        if (
            this.intensity >
            0.18
        ) {

            this.peakTimer +=
                dt;


            if (
                this.peakTimer >=
                this.nextPeak
            ) {

                this.peakTimer =
                    0;


                this.peakIntensity =
                    0.60 +
                    Math.random() *
                    0.40;


                this.flash =
                    0.05 +
                    Math.random() *
                    0.08;


                this._spawnPeakFragments();

                this._spawnPeakParticles();

                this._spawnImageGlitches(true);


                this.nextPeak =
                    this._random(
                        this.config.peakIntervalMin,
                        this.config.peakIntervalMax
                    ) /
                    (
                        0.72 +
                        this.intensity *
                        0.38
                    );

            }

        } else {

            this.peakTimer =
                0;

        }


        // =====================================================
        // DECAY DO PICO
        // =====================================================

        this.peakIntensity *=
            Math.pow(
                0.93,
                dt / 16.67
            );


        // =====================================================
        // DECAY DO PEQUENO FLASH
        // =====================================================

        this.flash *=
            Math.pow(
                0.88,
                dt / 16.67
            );


        // =====================================================
        // EMISSÃO CONTÍNUA DE PARTÍCULAS
        // =====================================================

        if (
            this.intensity >
            0.08
        ) {

            this.particleEmissionAccumulator +=
                dt *
                this.config.particleEmissionRate *
                (
                    0.45 +
                    this.intensity *
                    1.8
                );


            while (
                this.particleEmissionAccumulator >=
                1
            ) {

                this.particleEmissionAccumulator -=
                    1;


                this._spawnFloatingParticle();

            }

        } else {

            this.particleEmissionAccumulator =
                0;

        }


        // =====================================================
        // ATUALIZA GLITCHES DA IMAGEM
        // =====================================================

        for (
            let i =
                this.imageGlitches.length - 1;

            i >= 0;

            i--
        ) {

            const glitch =
                this.imageGlitches[i];


            glitch.life -=
                dt;


            glitch.x +=
                glitch.vx *
                dt;


            glitch.y +=
                glitch.vy *
                dt;


            glitch.rotation +=
                glitch.rotationSpeed *
                dt;


            glitch.offsetX *=
                Math.pow(
                    0.992,
                    dt
                );


            glitch.offsetY *=
                Math.pow(
                    0.992,
                    dt
                );


            if (
                glitch.life <=
                0
            ) {

                this.imageGlitches.splice(
                    i,
                    1
                );

            }

        }


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


            fragment.life -=
                dt;


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
                    0.996,
                    dt
                );


            fragment.vy *=
                Math.pow(
                    0.996,
                    dt
                );


            if (
                fragment.life <=
                0
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


            particle.life -=
                dt;


            particle.x +=
                particle.vx *
                dt;


            particle.y +=
                particle.vy *
                dt;


            particle.vx +=
                Math.sin(
                    this.time *
                    0.0012 +
                    particle.seed
                ) *
                0.0008 *
                dt;


            particle.vy +=
                Math.cos(
                    this.time *
                    0.001 +
                    particle.seed
                ) *
                0.0005 *
                dt;


            particle.vx *=
                Math.pow(
                    0.998,
                    dt
                );


            particle.vy *=
                Math.pow(
                    0.998,
                    dt
                );


            if (
                particle.life <=
                0
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
            this.intensity <
            0.01 &&

            this.targetIntensity <=
            0
        ) {

            this.fragments.length =
                0;


            this.particles.length =
                0;


            this.imageGlitches.length =
                0;


            this.peakIntensity =
                0;


            this.flash =
                0;

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

            personCanvas = null,

            sourceX = 0,

            sourceY = 0,

            sourceWidth = 0,

            sourceHeight = 0

        } = options;


        if (
            this.intensity <
            0.01
        ) {

            return;

        }


        // =====================================================
        // POSIÇÃO DA CABEÇA
        // =====================================================

        const head =
            this._resolveHeadPosition(
                options,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );


        const cx =
            head.x;


        const cy =
            head.y;


        const headRadius =
            head.radius;


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
            ) /
            2;


        const tension =
            this.intensity *
            (
                0.88 +
                pulse *
                0.12
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
        // HALO EXTERNO
        //
        // REDUZIDO EM ~40%
        //
        // Antes:
        // 0.40 + tension * 0.18
        //
        // Agora:
        // 0.24 + tension * 0.108
        // =====================================================

        const minSize =
            Math.min(
                drawWidth,
                drawHeight
            );


        // -----------------------------------------------------
        // Usa a cabeça como referência quando possível.
        // Isso deixa o halo proporcional ao rosto.
        // -----------------------------------------------------

        const baseHeadSize =
            headRadius > 0

                ? headRadius * 2.6

                : minSize;


        const glowRadius =
            Math.min(
                minSize * 0.34,
                baseHeadSize *
                (
                    0.78 +
                    tension *
                    0.20
                )
            );


        const gradient =
            ctx.createRadialGradient(

                cx,

                cy,

                glowRadius *
                0.08,

                cx,

                cy,

                glowRadius

            );


        gradient.addColorStop(
            0,
            `rgba(255, 15, 15, ${
                Math.min(
                    0.55,
                    0.16 +
                    tension *
                    0.26
                )
            })`
        );


        gradient.addColorStop(
            0.32,
            `rgba(245, 0, 0, ${
                Math.min(
                    0.40,
                    0.12 +
                    tension *
                    0.18
                )
            })`
        );


        gradient.addColorStop(
            0.68,
            `rgba(170, 0, 0, ${
                Math.min(
                    this.config.maxGlow,
                    0.10 +
                    tension *
                    0.18
                )
            })`
        );


        gradient.addColorStop(
            1,
            'rgba(100, 0, 0, 0)'
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            cx -
            glowRadius,

            cy -
            glowRadius,

            glowRadius *
            2,

            glowRadius *
            2
        );


        // =====================================================
        // SEGUNDO HALO MAIS PRÓXIMO DA CABEÇA
        //
        // Também reduzido em aproximadamente 40%.
        // =====================================================

        const innerRadius =
            Math.min(
                minSize * 0.21,
                headRadius *
                (
                    0.62 +
                    tension *
                    0.20
                )
            );


        const innerGradient =
            ctx.createRadialGradient(

                cx,

                cy,

                innerRadius *
                0.05,

                cx,

                cy,

                innerRadius

            );


        innerGradient.addColorStop(
            0,
            `rgba(255, 35, 35, ${
                0.10 +
                tension *
                0.15
            })`
        );


        innerGradient.addColorStop(
            0.5,
            `rgba(255, 0, 0, ${
                0.06 +
                tension *
                0.10
            })`
        );


        innerGradient.addColorStop(
            1,
            'rgba(120, 0, 0, 0)'
        );


        ctx.fillStyle =
            innerGradient;


        ctx.beginPath();


        ctx.arc(
            cx,
            cy,
            innerRadius,
            0,
            Math.PI * 2
        );


        ctx.fill();


        // =====================================================
        // PEQUENO ACENTO DE LUZ
        // =====================================================

        if (
            this.flash >
            0.01
        ) {

            ctx.save();


            ctx.globalAlpha =
                this.flash *
                this.intensity;


            ctx.fillStyle =
                '#ff3030';


            ctx.beginPath();


            ctx.arc(
                cx,
                cy,
                Math.max(
                    4,
                    headRadius *
                    0.055
                ),
                0,
                Math.PI * 2
            );


            ctx.fill();


            ctx.restore();

        }


        // =====================================================
        // GLITCH REAL DA IMAGEM
        // =====================================================

        if (
            personCanvas &&
            sourceWidth > 0 &&
            sourceHeight > 0
        ) {

            this._drawImageGlitches(

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
        // FRAGMENTOS GEOMÉTRICOS
        //
        // Agora também são relativos à cabeça.
        // =====================================================

        this._drawFragments(
            ctx,
            tension,
            cx,
            cy
        );


        // =====================================================
        // PARTÍCULAS
        //
        // Agora acompanham a cabeça.
        // =====================================================

        this._drawParticles(
            ctx,
            tension,
            cx,
            cy
        );


        // =====================================================
        // RAIOS DE ENERGIA
        //
        // REDUZIDOS EM ~40%.
        // =====================================================

        this._drawEnergyCracks(
            ctx,
            cx,
            cy,
            drawWidth,
            drawHeight,
            headRadius,
            tension,
            peak
        );


        ctx.restore();

    }


    // =========================================================
    // RESOLVE A POSIÇÃO DA CABEÇA
    //
    // Aceita várias formas para facilitar a integração com o
    // detect_emotion.js atual.
    // =========================================================

    _resolveHeadPosition(
        options,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    ) {

        let x = null;
        let y = null;
        let radius = null;


        // =====================================================
        // FORMATO 1
        //
        // options.head = {
        //     x,
        //     y,
        //     radius
        // }
        // =====================================================

        if (
            options.head &&
            Number.isFinite(options.head.x) &&
            Number.isFinite(options.head.y)
        ) {

            x =
                options.head.x;

            y =
                options.head.y;

            radius =
                Number.isFinite(
                    options.head.radius
                )
                    ? options.head.radius
                    : null;

        }


        // =====================================================
        // FORMATO 2
        //
        // options.faceBox
        //
        // { x, y, width, height }
        // =====================================================

        else if (
            options.faceBox &&
            Number.isFinite(options.faceBox.x) &&
            Number.isFinite(options.faceBox.y)
        ) {

            const box =
                options.faceBox;


            x =
                box.x +
                box.width /
                2;


            y =
                box.y +
                box.height *
                0.45;


            radius =
                Math.min(
                    box.width,
                    box.height
                ) /
                2;

        }


        // =====================================================
        // FORMATO 3
        //
        // options.headBox
        // =====================================================

        else if (
            options.headBox &&
            Number.isFinite(options.headBox.x) &&
            Number.isFinite(options.headBox.y)
        ) {

            const box =
                options.headBox;


            x =
                box.x +
                box.width /
                2;


            y =
                box.y +
                box.height *
                0.45;


            radius =
                Math.min(
                    box.width,
                    box.height
                ) /
                2;

        }


        // =====================================================
        // FORMATO 4
        //
        // Coordenadas individuais.
        // =====================================================

        else if (
            Number.isFinite(
                options.headCenterX
            ) &&
            Number.isFinite(
                options.headCenterY
            )
        ) {

            x =
                options.headCenterX;


            y =
                options.headCenterY;


            radius =
                Number.isFinite(
                    options.headRadius
                )
                    ? options.headRadius
                    : null;

        }


        // =====================================================
        // FALLBACK
        // =====================================================

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {

            x =
                drawX +
                drawWidth /
                2;


            y =
                drawY +
                drawHeight *
                0.45;

        }


        // =====================================================
        // RAIO PADRÃO
        // =====================================================

        if (
            !Number.isFinite(radius) ||
            radius <= 0
        ) {

            radius =
                Math.min(
                    drawWidth,
                    drawHeight
                ) *
                0.16;

        }


        // =====================================================
        // SUAVIZAÇÃO DA POSIÇÃO
        //
        // Evita que o halo dê pequenos "saltos" quando
        // o detector muda alguns pixels.
        // =====================================================

        if (
            Number.isFinite(
                this.headX
            ) &&
            Number.isFinite(
                this.headY
            )
        ) {

            this.headX +=
                (
                    x -
                    this.headX
                ) *
                this.headSmoothing;


            this.headY +=
                (
                    y -
                    this.headY
                ) *
                this.headSmoothing;


            if (
                Number.isFinite(
                    this.headRadius
                )
            ) {

                this.headRadius +=
                    (
                        radius -
                        this.headRadius
                    ) *
                    this.headSmoothing;

            } else {

                this.headRadius =
                    radius;

            }

        } else {

            this.headX =
                x;


            this.headY =
                y;


            this.headRadius =
                radius;

        }


        return {

            x:
                this.headX,

            y:
                this.headY,

            radius:
                this.headRadius

        };

    }


    // =========================================================
    // GLITCH DA PRÓPRIA IMAGEM SEGMENTADA
    // =========================================================

    _drawImageGlitches(
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


        const scaleX =
            drawWidth /
            sourceWidth;


        const scaleY =
            drawHeight /
            sourceHeight;


        ctx.save();


        ctx.globalCompositeOperation =
            'source-over';


        for (
            const glitch
            of this.imageGlitches
        ) {

            const lifeRatio =
                Math.max(
                    0,
                    Math.min(
                        1,
                        glitch.life /
                        glitch.maxLife
                    )
                );


            const alpha =
                lifeRatio *
                intensity *
                glitch.alpha;


            if (
                alpha <=
                0.01
            ) {

                continue;

            }


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


            const baseX =
                drawX +
                glitch.x *
                drawWidth;


            const baseY =
                drawY +
                glitch.y *
                drawHeight;


            const dw =
                sw *
                scaleX;


            const dh =
                sh *
                scaleY;


            const destX =
                baseX +
                glitch.offsetX *
                drawWidth;


            const destY =
                baseY +
                glitch.offsetY *
                drawHeight;


            ctx.save();


            ctx.globalAlpha =
                alpha;


            if (
                Math.abs(
                    glitch.rotation
                ) >
                0.001
            ) {

                ctx.translate(
                    destX +
                    dw /
                    2,

                    destY +
                    dh /
                    2
                );


                ctx.rotate(
                    glitch.rotation
                );


                ctx.drawImage(

                    personCanvas,

                    sx,
                    sy,
                    sw,
                    sh,

                    -dw /
                    2,

                    -dh /
                    2,

                    dw,
                    dh

                );

            } else {

                ctx.drawImage(

                    personCanvas,

                    sx,
                    sy,
                    sw,
                    sh,

                    destX,
                    destY,
                    dw,
                    dh

                );

            }


            ctx.restore();

        }


        ctx.restore();

    }


    // =========================================================
    // FRAGMENTOS
    // =========================================================

    _drawFragments(
        ctx,
        intensity,
        cx,
        cy
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
                alpha <=
                0
            ) {

                continue;

            }


            ctx.save();


            ctx.translate(
                cx +
                fragment.x,

                cy +
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

                -fragment.width /
                2,

                -fragment.height /
                2,

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
        cx,
        cy
    ) {

        for (
            const particle
            of this.particles
        ) {

            const lifeRatio =
                Math.max(
                    0,
                    Math.min(
                        1,
                        particle.life /
                        particle.maxLife
                    )
                );


            const fadeIn =
                Math.min(
                    1,
                    (
                        particle.maxLife -
                        particle.life
                    ) /
                    100
                );


            const alpha =
                lifeRatio *
                fadeIn *
                intensity *
                particle.alpha;


            if (
                alpha <=
                0.005
            ) {

                continue;

            }


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                particle.color;


            const px =
                cx +
                particle.x;


            const py =
                cy +
                particle.y;


            if (
                particle.glow
            ) {

                ctx.save();


                ctx.shadowBlur =
                    particle.size *
                    4;


                ctx.shadowColor =
                    particle.color;


                ctx.fillRect(

                    px,

                    py,

                    particle.size,

                    particle.size

                );


                ctx.restore();

            } else {

                ctx.fillRect(

                    px,

                    py,

                    particle.size,

                    particle.size

                );

            }

        }


        ctx.globalAlpha =
            1;

    }


    // =========================================================
    // RAIOS / ENERGIA
    //
    // Agora:
    // - menores
    // - centrados na cabeça
    // - acompanham o movimento facial
    // - continuam com pequeno movimento orgânico
    // =========================================================

    _drawEnergyCracks(
        ctx,
        cx,
        cy,
        width,
        height,
        headRadius,
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


        const minSize =
            Math.min(
                width,
                height
            );


        // =====================================================
        // ESCALA DO HALO
        //
        // Aproximadamente 40% menor que a versão original.
        // =====================================================

        const compactSize =
            Math.min(
                minSize *
                0.60,

                headRadius *
                2.55
            );


        ctx.save();


        ctx.lineCap =
            'round';


        for (
            let i = 0;

            i < count;

            i++
        ) {

            const baseAngle =
                (
                    Math.PI *
                    2 *
                    i /
                    count
                );


            // -------------------------------------------------
            // Pequena vibração angular.
            // -------------------------------------------------

            const movement =
                Math.sin(
                    this.time *
                    0.0008 +
                    i *
                    1.73
                ) *
                0.035;


            const angle =
                baseAngle +
                movement;


            // -------------------------------------------------
            // Começa mais perto da cabeça.
            //
            // Antes: ~25% do canvas
            // Agora: ~15%
            // -------------------------------------------------

            const startRadius =
                compactSize *
                (
                    0.25 +
                    Math.sin(
                        i *
                        4.13
                    ) *
                    0.025
                );


            // -------------------------------------------------
            // Raios aproximadamente 40% menores.
            // -------------------------------------------------

            const length =
                compactSize *
                (
                    0.07 +
                    intensity *
                    0.14 +
                    peak *
                    0.09
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


            const alpha =
                0.16 +
                intensity *
                0.30 +
                peak *
                0.18;


            ctx.strokeStyle =
                `rgba(255, 35, 35, ${
                    Math.min(
                        0.75,
                        alpha
                    )
                })`;


            ctx.lineWidth =
                1.2 +
                intensity *
                2.2;


            ctx.beginPath();


            ctx.moveTo(
                sx,
                sy
            );


            // -------------------------------------------------
            // Pequeno zigue-zague orgânico.
            // -------------------------------------------------

            const middleRadius =
                length *
                0.52;


            const middleAngle =
                angle +
                Math.sin(
                    i *
                    2.71 +
                    this.time *
                    0.0005
                ) *
                0.08;


            const mx =
                sx +
                Math.cos(
                    middleAngle
                ) *
                middleRadius;


            const my =
                sy +
                Math.sin(
                    middleAngle
                ) *
                middleRadius;


            ctx.lineTo(
                mx,
                my
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
    // CRIA GLITCHES DA IMAGEM
    // =========================================================

    _spawnImageGlitches(
        strong = false
    ) {

        const amount =
            strong

                ? Math.floor(
                    10 +
                    this.intensity *
                    12
                )

                : Math.floor(
                    5 +
                    this.intensity *
                    9
                );


        for (
            let i = 0;

            i < amount;

            i++
        ) {

            if (
                this.imageGlitches.length >=
                this.config.maxImageGlitches
            ) {

                break;

            }


            const pseudoSourceWidth =
                120;


            const pseudoSourceHeight =
                180;


            const x =
                Math.random() *
                pseudoSourceWidth;


            const y =
                Math.random() *
                pseudoSourceHeight;


            const glitchWidth =
                5 +
                Math.random() *
                (
                    strong
                        ? 28
                        : 22
                );


            const glitchHeight =
                5 +
                Math.random() *
                (
                    strong
                        ? 30
                        : 24
                );


            const centerX =
                pseudoSourceWidth /
                2;


            const centerY =
                pseudoSourceHeight *
                0.45;


            const dx =
                x +
                glitchWidth /
                2 -
                centerX;


            const dy =
                y +
                glitchHeight /
                2 -
                centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                ) ||
                1;


            const dirX =
                dx /
                distance;


            const dirY =
                dy /
                distance;


            const outward =
                (
                    8 +
                    Math.random() *
                    (
                        strong
                            ? 45
                            : 30
                    )
                ) *
                (
                    0.55 +
                    this.intensity *
                    0.65
                );


            this.imageGlitches.push({

                x:
                    x /
                    pseudoSourceWidth,

                y:
                    y /
                    pseudoSourceHeight,

                width:
                    glitchWidth /
                    pseudoSourceWidth,

                height:
                    glitchHeight /
                    pseudoSourceHeight,


                offsetX:
                    dirX *
                    outward /
                    120,

                offsetY:
                    dirY *
                    outward /
                    180,


                vx:
                    dirX *
                    (
                        0.005 +
                        Math.random() *
                        0.025
                    ),

                vy:
                    dirY *
                    (
                        0.005 +
                        Math.random() *
                        0.025
                    ),


                rotation:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.10,


                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.0004,


                life:
                    45 +
                    Math.random() *
                    (
                        strong
                            ? 130
                            : 90
                    ),


                maxLife:
                    180,


                alpha:
                    0.35 +
                    Math.random() *
                    0.55

            });

        }

    }


    // =========================================================
    // CRIA FRAGMENTOS GEOMÉTRICOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                8 +
                this.intensity *
                12
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
                70 +
                Math.random() *
                100;


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
                    8,


                height:
                    2 +
                    Math.random() *
                    7,


                rotation:
                    Math.random() *
                    Math.PI,


                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.012,


                life:
                    400 +
                    Math.random() *
                    800,


                maxLife:
                    1200,


                color:
                    Math.random() >
                    0.30

                        ? '#ff2020'

                        : '#ff7777'

            });

        }

    }


    // =========================================================
    // EXPLOSÃO DE PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                18 +
                this.intensity *
                28
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


            this._createParticle(
                true
            );

        }

    }


    // =========================================================
    // PARTÍCULA FLUTUANTE CONTÍNUA
    // =========================================================

    _spawnFloatingParticle() {

        if (
            this.particles.length >=
            this.config.maxParticles
        ) {

            return;

        }


        this._createParticle(
            false
        );

    }


    // =========================================================
    // CRIA PARTÍCULA
    // =========================================================

    _createParticle(
        explosion
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const radius =
            explosion

                ? (
                    45 +
                    Math.random() *
                    95
                )

                : (
                    55 +
                    Math.random() *
                    110
                );


        const speed =
            explosion

                ? (
                    0.035 +
                    Math.random() *
                    0.15
                )

                : (
                    0.012 +
                    Math.random() *
                    0.055
                );


        const x =
            Math.cos(angle) *
            radius;


        const y =
            Math.sin(angle) *
            radius *
            0.78;


        const verticalLift =
            explosion

                ? (
                    -0.015 -
                    Math.random() *
                    0.025
                )

                : (
                    -0.004 -
                    Math.random() *
                    0.012
                );


        this.particles.push({

            x,

            y,


            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed +
                verticalLift,


            size:
                explosion

                    ? (
                        1.2 +
                        Math.random() *
                        4.0
                    )

                    : (
                        0.8 +
                        Math.random() *
                        2.8
                    ),


            life:
                explosion

                    ? (
                        450 +
                        Math.random() *
                        950
                    )

                    : (
                        700 +
                        Math.random() *
                        1500
                    ),


            maxLife:
                explosion
                    ? 1400
                    : 2200,


            alpha:
                explosion

                    ? (
                        0.45 +
                        Math.random() *
                        0.55
                    )

                    : (
                        0.25 +
                        Math.random() *
                        0.60
                    ),


            color:
                Math.random() >
                0.28

                    ? '#ff3030'

                    : (
                        Math.random() >
                        0.45

                            ? '#ff7777'

                            : '#ffb0b0'
                    ),


            glow:
                Math.random() >
                0.35,


            seed:
                Math.random() *
                1000

        });

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


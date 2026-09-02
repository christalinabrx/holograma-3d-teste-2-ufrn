// ============================================================
// ANGRY EFFECTS
// Sistema procedural de efeitos visuais para a emoção ANGRY
//
// Conceito:
// - cabeça em combustão
// - halo vibrante
// - raios de energia
// - glitch da própria imagem segmentada
// - fragmentação digital
// - partículas / fagulhas
// - explosões
//
// IMPORTANTE:
// Este módulo NÃO detecta emoções.
// Ele apenas recebe emoção + confiança.
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

            pulseSpeed:
                0.0018,


            // -------------------------------------------------
            // HALO
            // -------------------------------------------------

            maxGlow:
                0.72,


            // -------------------------------------------------
            // FRAGMENTOS
            // -------------------------------------------------

            maxFragments:
                34,


            // -------------------------------------------------
            // PARTÍCULAS
            // -------------------------------------------------

            maxParticles:
                150,


            // -------------------------------------------------
            // GLITCH
            // -------------------------------------------------

            glitchIntervalMin:
                550,

            glitchIntervalMax:
                1400,

            glitchDuration:
                85,

            maxImageGlitches:
                26,


            // -------------------------------------------------
            // PICOS
            // -------------------------------------------------

            peakIntervalMin:
                1500,

            peakIntervalMax:
                3300,


            // -------------------------------------------------
            // EMISSÃO DE PARTÍCULAS
            // -------------------------------------------------

            particleEmissionRate:
                0.09,


            // -------------------------------------------------
            // RAIOS
            // -------------------------------------------------

            rayCount:
                22

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
        // PICOS
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

        this.particleEmissionAccumulator = 0;


        // =====================================================
        // VIBRAÇÃO DO HALO
        // =====================================================

        this.haloShakeX = 0;

        this.haloShakeY = 0;

        this.haloShakeRadius = 0;


        // =====================================================
        // PEQUENO BRILHO DE IMPACTO
        // =====================================================

        this.flash = 0;

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

        this.time += dt;


        // =====================================================
        // VIBRAÇÃO DO HALO
        // =====================================================

        const vibration =
            this.intensity *
            (
                0.45 +
                this.peakIntensity *
                0.35
            );


        this.haloShakeX =
            Math.sin(
                this.time *
                0.018
            ) *
            vibration *
            2.5;


        this.haloShakeY =
            Math.cos(
                this.time *
                0.0157
            ) *
            vibration *
            2.0;


        this.haloShakeRadius =
            Math.sin(
                this.time *
                0.012
            ) *
            vibration *
            4;


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
                        0.85 +
                        this.intensity *
                        0.40
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
                        0.22
                    );


                this._spawnImageGlitches();

            }

        } else {

            this.glitchTimer = 0;

            this.glitchRemaining = 0;

        }


        // =====================================================
        // DURAÇÃO DO GLITCH
        // =====================================================

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
        // PICOS DE RAIVA
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
                    0.60 +
                    Math.random() *
                    0.40;


                // Muito discreto.
                // Não pisca a tela.

                this.flash =
                    0.04 +
                    Math.random() *
                    0.07;


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

            this.peakTimer = 0;

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
        // DECAY DO BRILHO
        // =====================================================

        this.flash *=
            Math.pow(
                0.88,
                dt / 16.67
            );


        // =====================================================
        // EMISSÃO CONTÍNUA DE FAGULHAS
        // =====================================================

        if (
            this.intensity >
            0.08
        ) {

            this.particleEmissionAccumulator +=
                dt *
                this.config.particleEmissionRate *
                (
                    0.55 +
                    this.intensity *
                    1.8
                );


            while (
                this.particleEmissionAccumulator >=
                1
            ) {

                this.particleEmissionAccumulator -= 1;

                this._spawnFloatingParticle();

            }

        } else {

            this.particleEmissionAccumulator = 0;

        }


        // =====================================================
        // ATUALIZA GLITCHES
        // =====================================================

        for (
            let i =
                this.imageGlitches.length - 1;

            i >= 0;

            i--
        ) {

            const glitch =
                this.imageGlitches[i];


            glitch.life -= dt;


            glitch.x +=
                glitch.vx *
                dt;


            glitch.y +=
                glitch.vy *
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


            glitch.rotation +=
                glitch.rotationSpeed *
                dt;


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


            particle.life -= dt;


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
        // CENTRO
        // =====================================================

        const cx =
            drawX +
            drawWidth / 2 +
            this.haloShakeX;


        const cy =
            drawY +
            drawHeight * 0.45 +
            this.haloShakeY;


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
                0.90 +
                pulse *
                0.10
            );


        const peak =
            this.peakIntensity *
            this.intensity;


        ctx.save();


        // =====================================================
        // HALO
        // =====================================================

        this._drawContainedHalo(

            ctx,

            drawX,
            drawY,
            drawWidth,
            drawHeight,

            cx,
            cy,

            tension,
            peak

        );


        // =====================================================
        // EFEITO DE CHAMA SOBRE A PESSOA
        // =====================================================

        if (
            personCanvas &&
            sourceWidth > 0 &&
            sourceHeight > 0
        ) {

            this._drawFlameOverlay(

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

                tension,
                peak

            );

        }


        // =====================================================
        // GLITCH DA IMAGEM REAL
        // =====================================================

        if (
            personCanvas &&
            sourceWidth > 0 &&
            sourceHeight > 0 &&
            this.glitchRemaining > 0
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
        // FRAGMENTOS
        // =====================================================

        this._drawFragments(
            ctx,
            tension,
            drawX,
            drawY
        );


        // =====================================================
        // FAGULHAS
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

        this._drawEnergyCracks(

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
    // HALO CONTIDO NO VÍDEO
    // =========================================================

    _drawContainedHalo(
        ctx,
        x,
        y,
        width,
        height,
        cx,
        cy,
        intensity,
        peak
    ) {

        // -----------------------------------------------------
        // Descobre quanto espaço existe até cada borda.
        // -----------------------------------------------------

        const left =
            cx - x;

        const right =
            x +
            width -
            cx;

        const top =
            cy - y;

        const bottom =
            y +
            height -
            cy;


        // O halo nunca pode ultrapassar o canvas.

        const maxRadius =
            Math.max(
                20,
                Math.min(
                    left,
                    right,
                    top,
                    bottom
                )
            );


        const radius =
            Math.min(
                maxRadius *
                0.92,

                Math.min(
                    width,
                    height
                ) *
                (
                    0.34 +
                    intensity *
                    0.16
                ) +
                this.haloShakeRadius
            );


        // -----------------------------------------------------
        // HALO PRINCIPAL
        // -----------------------------------------------------

        const gradient =
            ctx.createRadialGradient(

                cx,
                cy,

                radius * 0.03,

                cx,
                cy,

                radius

            );


        gradient.addColorStop(

            0,

            `rgba(255, 55, 20, ${
                0.14 +
                intensity *
                0.18
            })`

        );


        gradient.addColorStop(

            0.28,

            `rgba(255, 35, 10, ${
                0.10 +
                intensity *
                0.16
            })`

        );


        gradient.addColorStop(

            0.58,

            `rgba(235, 15, 5, ${
                0.06 +
                intensity *
                0.11
            })`

        );


        gradient.addColorStop(

            0.82,

            `rgba(170, 5, 0, ${
                0.035 +
                intensity *
                0.055
            })`

        );


        gradient.addColorStop(

            1,

            'rgba(80, 0, 0, 0)'

        );


        ctx.fillStyle =
            gradient;


        // IMPORTANTE:
        // o retângulo permanece dentro do canvas.

        ctx.fillRect(
            x,
            y,
            width,
            height
        );


        // -----------------------------------------------------
        // PEQUENO NÚCLEO INCANDESCENTE
        // -----------------------------------------------------

        const coreRadius =
            radius *
            (
                0.18 +
                intensity *
                0.05
            );


        const core =
            ctx.createRadialGradient(

                cx,
                cy,

                0,

                cx,
                cy,

                coreRadius

            );


        core.addColorStop(
            0,
            `rgba(255, 190, 70, ${
                0.05 +
                intensity *
                0.10
            })`
        );


        core.addColorStop(
            0.45,
            `rgba(255, 70, 20, ${
                0.05 +
                intensity *
                0.08
            })`
        );


        core.addColorStop(
            1,
            'rgba(255, 20, 0, 0)'
        );


        ctx.fillStyle =
            core;


        ctx.fillRect(
            x,
            y,
            width,
            height
        );

    }


    // =========================================================
    // GRADIENTE DE CHAMA SOBRE A PESSOA
    // =========================================================

    _drawFlameOverlay(
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
        intensity,
        peak
    ) {

        ctx.save();


        // -----------------------------------------------------
        // O gradient é desenhado sobre a imagem já existente.
        //
        // "source-atop" faz com que ele permaneça somente
        // onde já existe a pessoa.
        // -----------------------------------------------------

        ctx.globalCompositeOperation =
            'source-atop';


        const gradient =
            ctx.createLinearGradient(

                drawX,
                drawY +
                drawHeight,

                drawX +
                drawWidth *
                0.15,

                drawY

            );


        // Base mais escura.

        gradient.addColorStop(

            0,

            `rgba(120, 5, 0, ${
                0.12 +
                intensity *
                0.16
            })`

        );


        // Vermelho.

        gradient.addColorStop(

            0.30,

            `rgba(225, 15, 0, ${
                0.12 +
                intensity *
                0.18
            })`

        );


        // Laranja.

        gradient.addColorStop(

            0.58,

            `rgba(255, 80, 5, ${
                0.10 +
                intensity *
                0.18
            })`

        );


        // Amarelo incandescente.

        gradient.addColorStop(

            0.78,

            `rgba(255, 170, 25, ${
                0.06 +
                intensity *
                0.13
            })`

        );


        // Ponta quente.

        gradient.addColorStop(

            1,

            `rgba(255, 215, 80, ${
                0.035 +
                intensity *
                0.08
            })`

        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(

            drawX,
            drawY,
            drawWidth,
            drawHeight

        );


        // -----------------------------------------------------
        // MANCHAS DE CALOR
        // -----------------------------------------------------

        ctx.globalCompositeOperation =
            'source-atop';


        const heatX =
            drawX +
            drawWidth *
            (
                0.35 +
                Math.sin(
                    this.time *
                    0.001
                ) *
                0.06
            );


        const heatY =
            drawY +
            drawHeight *
            0.27;


        const heatRadius =
            Math.min(
                drawWidth,
                drawHeight
            ) *
            (
                0.18 +
                intensity *
                0.05
            );


        const heat =
            ctx.createRadialGradient(

                heatX,
                heatY,

                0,

                heatX,
                heatY,

                heatRadius

            );


        heat.addColorStop(
            0,
            `rgba(255, 215, 70, ${
                0.05 +
                intensity *
                0.10
            })`
        );


        heat.addColorStop(
            0.45,
            `rgba(255, 100, 10, ${
                0.04 +
                intensity *
                0.08
            })`
        );


        heat.addColorStop(
            1,
            'rgba(255, 0, 0, 0)'
        );


        ctx.fillStyle =
            heat;


        ctx.fillRect(

            drawX,
            drawY,
            drawWidth,
            drawHeight

        );


        ctx.restore();

    }


    // =========================================================
    // GLITCH DA PRÓPRIA IMAGEM
    //
    // ATENÇÃO:
    // Não desenha linhas.
    // Não desenha barras.
    // Não desenha retângulos coloridos.
    //
    // Todos os pixels vêm do personCanvas.
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
                Math.max(
                    2,
                    glitch.width *
                    sourceWidth
                );


            const sh =
                Math.max(
                    2,
                    glitch.height *
                    sourceHeight
                );


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


            // -------------------------------------------------
            // IMPORTANTE:
            // sourceRect é sempre um pedaço da pessoa.
            // -------------------------------------------------

            if (
                Math.abs(
                    glitch.rotation
                ) >
                0.001
            ) {

                ctx.translate(

                    destX +
                    dw / 2,

                    destY +
                    dh / 2

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

                    -dw / 2,
                    -dh / 2,
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
                alpha <=
                0
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
                fragment.glow
                    ? 5
                    : 0;


            ctx.shadowColor =
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


            ctx.save();


            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                particle.color;


            if (
                particle.glow
            ) {

                ctx.shadowBlur =
                    particle.size *
                    4;

                ctx.shadowColor =
                    particle.color;

            }


            // -------------------------------------------------
            // Fagulha alongada
            // -------------------------------------------------

            if (
                particle.spark
            ) {

                ctx.translate(

                    drawX +
                    particle.x,

                    drawY +
                    particle.y

                );


                ctx.rotate(
                    particle.angle
                );


                ctx.fillRect(

                    0,
                    0,

                    particle.size *
                    2.4,

                    particle.size *
                    0.65

                );

            } else {

                ctx.fillRect(

                    drawX +
                    particle.x,

                    drawY +
                    particle.y,

                    particle.size,

                    particle.size

                );

            }


            ctx.restore();

        }


        ctx.globalAlpha = 1;

    }


    // =========================================================
    // RAIOS
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


        ctx.save();


        ctx.lineCap =
            'round';


        ctx.lineJoin =
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


            const movement =
                Math.sin(

                    this.time *
                    0.0009 +

                    i *
                    1.73

                ) *
                0.045;


            const angle =
                baseAngle +
                movement;


            const startRadius =
                minSize *
                (
                    0.23 +
                    Math.sin(
                        i *
                        4.13
                    ) *
                    0.025
                );


            const length =
                minSize *
                (
                    0.075 +
                    intensity *
                    0.15 +
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
                0.18 +
                intensity *
                0.30 +
                peak *
                0.18;


            // -------------------------------------------------
            // Mistura vermelho, laranja e amarelo.
            // -------------------------------------------------

            const rayColor =
                i % 5 === 0

                    ? `rgba(255, 180, 45, ${
                        Math.min(
                            0.82,
                            alpha
                        )
                    })`

                    : i % 3 === 0

                        ? `rgba(255, 85, 20, ${
                            Math.min(
                                0.78,
                                alpha
                            )
                        })`

                        : `rgba(255, 35, 45, ${
                            Math.min(
                                0.78,
                                alpha
                            )
                        })`;


            ctx.strokeStyle =
                rayColor;


            ctx.lineWidth =
                1.3 +
                intensity *
                2.0;


            ctx.shadowBlur =
                3 +
                intensity *
                5;


            ctx.shadowColor =
                rayColor;


            ctx.beginPath();


            ctx.moveTo(
                sx,
                sy
            );


            const middleRadius =
                length *
                0.50;


            const middleAngle =
                angle +

                Math.sin(
                    i *
                    2.71 +
                    this.time *
                    0.00055
                ) *
                0.09;


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
                    12 +
                    this.intensity *
                    14
                )

                : Math.floor(
                    5 +
                    this.intensity *
                    10
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


            // -------------------------------------------------
            // Coordenadas normalizadas.
            // -------------------------------------------------

            const x =
                Math.random();


            const y =
                Math.random();


            // Fragmentos pequenos e irregulares.

            const width =
                0.025 +
                Math.random() *
                (
                    strong
                        ? 0.16
                        : 0.11
                );


            const height =
                0.025 +
                Math.random() *
                (
                    strong
                        ? 0.15
                        : 0.10
                );


            // -------------------------------------------------
            // Centro da cabeça.
            // -------------------------------------------------

            const centerX =
                0.50;


            const centerY =
                0.45;


            const dx =
                x +
                width / 2 -
                centerX;


            const dy =
                y +
                height / 2 -
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


            // -------------------------------------------------
            // Quanto mais intenso, mais longe o pedaço voa.
            // -------------------------------------------------

            const outward =
                (
                    0.025 +
                    Math.random() *
                    (
                        strong
                            ? 0.18
                            : 0.12
                    )
                ) *
                (
                    0.65 +
                    this.intensity *
                    0.75
                );


            this.imageGlitches.push({

                x,

                y,

                width,

                height,


                offsetX:
                    dirX *
                    outward,

                offsetY:
                    dirY *
                    outward,


                vx:
                    dirX *
                    (
                        0.00002 +
                        Math.random() *
                        0.00010
                    ),

                vy:
                    dirY *
                    (
                        0.00002 +
                        Math.random() *
                        0.00010
                    ),


                rotation:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.12,


                rotationSpeed:
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.0003,


                life:
                    45 +
                    Math.random() *
                    (
                        strong
                            ? 125
                            : 85
                    ),


                maxLife:
                    170,


                alpha:
                    0.45 +
                    Math.random() *
                    0.50

            });

        }

    }


    // =========================================================
    // FRAGMENTOS
    // =========================================================

    _spawnPeakFragments() {

        const amount =
            Math.floor(
                10 +
                this.intensity *
                14
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
                60 +
                Math.random() *
                110;


            const speed =
                0.025 +
                Math.random() *
                0.13;


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
                    2 +
                    Math.random() *
                    8,


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
                    850,


                maxLife:
                    1250,


                glow:
                    Math.random() >
                    0.30,


                color:
                    Math.random() >
                    0.45

                        ? '#ff3030'

                        : Math.random() >
                          0.40

                            ? '#ff7a20'

                            : '#ffc044'

            });

        }

    }


    // =========================================================
    // EXPLOSÃO DE PARTÍCULAS
    // =========================================================

    _spawnPeakParticles() {

        const amount =
            Math.floor(
                25 +
                this.intensity *
                40
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
    // PARTÍCULA CONTÍNUA
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
                    40 +
                    Math.random() *
                    105
                )

                : (
                    45 +
                    Math.random() *
                    125
                );


        const speed =
            explosion

                ? (
                    0.035 +
                    Math.random() *
                    0.17
                )

                : (
                    0.010 +
                    Math.random() *
                    0.065
                );


        const x =
            Math.cos(angle) *
            radius;


        const y =
            Math.sin(angle) *
            radius *
            0.78;


        const colors = [

            '#ff2020',

            '#ff3d20',

            '#ff6a20',

            '#ff9325',

            '#ffc247',

            '#ffe08a'

        ];


        // Amarelo aparece menos que vermelho,
        // mas agora existe de verdade.

        const colorIndex =
            Math.random() < 0.55

                ? Math.floor(
                    Math.random() *
                    3
                )

                : 3 +
                  Math.floor(
                      Math.random() *
                      3
                  );


        this.particles.push({

            x,

            y,


            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed -
                (
                    explosion
                        ? 0.015
                        : 0.005
                ),


            size:
                explosion

                    ? (
                        1.2 +
                        Math.random() *
                        4.5
                    )

                    : (
                        0.8 +
                        Math.random() *
                        3.2
                    ),


            life:
                explosion

                    ? (
                        500 +
                        Math.random() *
                        1100
                    )

                    : (
                        750 +
                        Math.random() *
                        1700
                    ),


            maxLife:
                explosion
                    ? 1600
                    : 2450,


            alpha:
                explosion

                    ? (
                        0.50 +
                        Math.random() *
                        0.50
                    )

                    : (
                        0.30 +
                        Math.random() *
                        0.65
                    ),


            color:
                colors[colorIndex],


            glow:
                Math.random() >
                0.28,


            spark:
                Math.random() >
                0.45,


            angle:
                angle +
                (
                    Math.random() -
                    0.5
                ) *
                0.8,


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

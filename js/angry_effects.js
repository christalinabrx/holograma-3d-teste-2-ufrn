
// ============================================================
// ANGRY EFFECTS
// Sistema visual procedural para a emoção "angry"
// Compatível com EmotionController / detec_emotion.js
// ============================================================

export class AngryEffects {

    constructor() {

        // =====================================================
        // ESTADO DA EMOÇÃO
        // =====================================================

        this.currentEmotion = 'neutral';

        this.targetIntensity = 0;

        this.intensity = 0;


        // =====================================================
        // ANIMAÇÃO
        // =====================================================

        this.time = 0;

        this._lastUpdateTime = 0;


        // Velocidade de entrada do efeito

        this._fadeInSpeed = 0.006;


        // Velocidade de saída

        this._fadeOutSpeed = 0.004;


        // =====================================================
        // PARTÍCULAS / FAÍSCAS
        // =====================================================

        this.particles = [];

        this._particleCount = 18;


        // =====================================================
        // ONDULAÇÃO
        // =====================================================

        this.waveTime = 0;


        // =====================================================
        // RANDOM SEED
        // =====================================================

        this._randomSeed = Math.random() * 10000;


        // =====================================================
        // CONFIGURAÇÃO VISUAL
        // =====================================================

        this.config = {

            // intensidade geral
            maxIntensity: 1,

            // quantidade de partículas
            particleCount: 18,

            // velocidade das partículas
            particleSpeed: 0.035,

            // vida das partículas
            particleLife: 900,

            // tamanho mínimo
            minParticleSize: 1.2,

            // tamanho máximo
            maxParticleSize: 4.5,

            // espessura das linhas
            lineWidth: 1.5,

            // quantidade de linhas de tensão
            tensionLines: 7

        };


        // =====================================================
        // CRIA PARTÍCULAS
        // =====================================================

        this._createParticles();
    }


    // =========================================================
    // CRIA PARTÍCULAS
    // =========================================================

    _createParticles() {

        this.particles = [];


        for (
            let i = 0;
            i < this._particleCount;
            i++
        ) {

            this.particles.push({

                x: Math.random(),

                y: Math.random(),

                vx:
                    (Math.random() - 0.5) *
                    0.001,

                vy:
                    (Math.random() - 0.5) *
                    0.001,

                size:
                    this.config.minParticleSize +
                    Math.random() *
                    (
                        this.config.maxParticleSize -
                        this.config.minParticleSize
                    ),

                life:
                    Math.random() *
                    this.config.particleLife,

                maxLife:
                    this.config.particleLife *
                    (
                        0.7 +
                        Math.random() * 0.6
                    ),

                phase:
                    Math.random() *
                    Math.PI *
                    2,

                speed:
                    0.5 +
                    Math.random() * 1.5

            });
        }
    }


    // =========================================================
    // ALTERA EMOÇÃO
    // =========================================================

    setEmotion(
        emotion,
        confidence = 0
    ) {

        this.currentEmotion =
            emotion || 'neutral';


        // =====================================================
        // SOMENTE ANGRY ATIVA O SISTEMA
        // =====================================================

        if (
            this.currentEmotion === 'angry'
        ) {

            const normalizedConfidence =
                Math.max(
                    0,
                    Math.min(
                        1,
                        Number(confidence) || 0
                    )
                );


            /*
             * Evita que uma confiança muito baixa
             * produza um efeito exagerado.
             */

            this.targetIntensity =
                Math.max(
                    0.25,
                    normalizedConfidence
                );

        } else {

            this.targetIntensity = 0;
        }
    }


    // =========================================================
    // ATUALIZA ANIMAÇÃO
    // =========================================================

    update(delta = 16) {

        // proteção contra valores inválidos

        if (
            !Number.isFinite(delta) ||
            delta < 0
        ) {

            delta = 16;
        }


        // evita saltos gigantes

        delta =
            Math.min(
                delta,
                50
            );


        // =====================================================
        // TEMPO
        // =====================================================

        this.time += delta;

        this.waveTime +=
            delta * 0.002;


        // =====================================================
        // TRANSIÇÃO DA INTENSIDADE
        // =====================================================

        if (
            this.intensity <
            this.targetIntensity
        ) {

            this.intensity +=
                this._fadeInSpeed *
                delta;

        } else if (
            this.intensity >
            this.targetIntensity
        ) {

            this.intensity -=
                this._fadeOutSpeed *
                delta;
        }


        this.intensity =
            Math.max(
                0,
                Math.min(
                    1,
                    this.intensity
                )
            );


        // =====================================================
        // ATUALIZA PARTÍCULAS
        // =====================================================

        this._updateParticles(
            delta
        );
    }


    // =========================================================
    // ATUALIZA PARTÍCULAS
    // =========================================================

    _updateParticles(delta) {

        for (
            const particle
            of this.particles
        ) {

            particle.life -=
                delta;


            // =================================================
            // RENOVA PARTÍCULA
            // =================================================

            if (
                particle.life <= 0
            ) {

                particle.x =
                    Math.random();

                particle.y =
                    Math.random();

                particle.vx =
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.001;

                particle.vy =
                    (
                        Math.random() -
                        0.5
                    ) *
                    0.001;

                particle.life =
                    particle.maxLife;
            }


            // =================================================
            // MOVIMENTO
            // =================================================

            particle.x +=
                particle.vx *
                delta *
                this.config.particleSpeed *
                20;


            particle.y +=
                particle.vy *
                delta *
                this.config.particleSpeed *
                20;


            // =================================================
            // MOVIMENTO ORGÂNICO
            // =================================================

            particle.x +=
                Math.sin(
                    this.time *
                    0.003 *
                    particle.speed +
                    particle.phase
                ) *
                0.00012 *
                delta;


            particle.y +=
                Math.cos(
                    this.time *
                    0.002 *
                    particle.speed +
                    particle.phase
                ) *
                0.00008 *
                delta;


            // =================================================
            // WRAP
            // =================================================

            if (
                particle.x < 0
            ) {

                particle.x = 1;

            } else if (
                particle.x > 1
            ) {

                particle.x = 0;
            }


            if (
                particle.y < 0
            ) {

                particle.y = 1;

            } else if (
                particle.y > 1
            ) {

                particle.y = 0;
            }
        }
    }


    // =========================================================
    // DESENHA
    // =========================================================

    draw(
        ctx,
        options = {}
    ) {

        if (
            !ctx
        ) {

            return;
        }


        // =====================================================
        // SE NÃO É ANGRY, NÃO DESENHA
        // =====================================================

        if (
            this.intensity <= 0.001
        ) {

            return;
        }


        // =====================================================
        // PARÂMETROS RECEBIDOS DO EmotionController
        // =====================================================

        const drawX =
            Number(options.drawX) || 0;

        const drawY =
            Number(options.drawY) || 0;

        const drawWidth =
            Number(options.drawWidth) || 0;

        const drawHeight =
            Number(options.drawHeight) || 0;


        if (
            drawWidth <= 0 ||
            drawHeight <= 0
        ) {

            return;
        }


        const intensity =
            this.intensity;


        // =====================================================
        // SALVA CONTEXTO
        // =====================================================

        ctx.save();


        /*
         * Tudo fica limitado à área da cabeça.
         */

        ctx.beginPath();

        ctx.rect(
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );

        ctx.clip();


        // =====================================================
        // EFEITO DE TENSÃO AO REDOR DA CABEÇA
        // =====================================================

        this._drawTensionLines(

            ctx,

            drawX,
            drawY,
            drawWidth,
            drawHeight,

            intensity

        );


        // =====================================================
        // PARTÍCULAS
        // =====================================================

        this._drawParticles(

            ctx,

            drawX,
            drawY,
            drawWidth,
            drawHeight,

            intensity

        );


        // =====================================================
        // LINHAS DE ENERGIA
        // =====================================================

        this._drawEnergyWaves(

            ctx,

            drawX,
            drawY,
            drawWidth,
            drawHeight,

            intensity

        );


        ctx.restore();
    }


    // =========================================================
    // LINHAS DE TENSÃO
    // =========================================================

    _drawTensionLines(
        ctx,
        x,
        y,
        width,
        height,
        intensity
    ) {

        const count =
            this.config.tensionLines;


        ctx.save();


        ctx.lineWidth =
            this.config.lineWidth *
            (
                0.6 +
                intensity *
                1.4
            );


        ctx.globalAlpha =
            0.12 +
            intensity *
            0.35;


        /*
         * As linhas ficam principalmente
         * nas regiões laterais e superiores,
         * criando uma sensação de tensão.
         */

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const phase =
                this.waveTime *
                1.5 +
                i *
                1.7;


            const side =
                i % 2 === 0
                    ? -1
                    : 1;


            const normalizedY =
                0.12 +
                (
                    i /
                    Math.max(
                        1,
                        count - 1
                    )
                ) *
                0.76;


            const startX =
                side < 0
                    ? x + width * 0.08
                    : x + width * 0.92;


            const endX =
                side < 0
                    ? x + width * 0.02
                    : x + width * 0.98;


            const startY =
                y +
                height *
                normalizedY;


            const endY =
                startY +
                Math.sin(phase) *
                height *
                0.035;


            ctx.beginPath();


            ctx.moveTo(
                startX,
                startY
            );


            ctx.lineTo(
                endX,
                endY
            );


            ctx.stroke();
        }


        ctx.restore();
    }


    // =========================================================
    // PARTÍCULAS
    // =========================================================

    _drawParticles(
        ctx,
        x,
        y,
        width,
        height,
        intensity
    ) {

        ctx.save();


        for (
            const particle
            of this.particles
        ) {

            // partículas ficam quase invisíveis
            // quando o angry está fraco

            const lifeRatio =
                Math.max(
                    0,
                    Math.min(
                        1,
                        particle.life /
                        particle.maxLife
                    )
                );


            const alpha =
                intensity *
                lifeRatio *
                0.55;


            if (
                alpha <= 0.01
            ) {

                continue;
            }


            const px =
                x +
                particle.x *
                width;


            const py =
                y +
                particle.y *
                height;


            const pulse =
                0.7 +
                Math.sin(
                    this.time *
                    0.006 +
                    particle.phase
                ) *
                0.3;


            const size =
                particle.size *
                (
                    0.6 +
                    intensity *
                    0.8
                ) *
                pulse;


            ctx.globalAlpha =
                alpha;


            ctx.beginPath();


            ctx.arc(
                px,
                py,
                size,
                0,
                Math.PI * 2
            );


            ctx.fill();
        }


        ctx.restore();
    }


    // =========================================================
    // ONDAS DE ENERGIA
    // =========================================================

    _drawEnergyWaves(
        ctx,
        x,
        y,
        width,
        height,
        intensity
    ) {

        ctx.save();


        ctx.lineWidth =
            0.8 +
            intensity *
            1.5;


        ctx.globalAlpha =
            0.08 +
            intensity *
            0.20;


        /*
         * Ondas horizontais discretas.
         */

        const waveCount = 4;


        for (
            let i = 0;
            i < waveCount;
            i++
        ) {

            const baseY =
                y +
                height *
                (
                    0.20 +
                    i *
                    0.20
                );


            const amplitude =
                height *
                0.012 *
                intensity;


            const frequency =
                0.012 +
                i *
                0.002;


            ctx.beginPath();


            const step =
                Math.max(
                    8,
                    width / 80
                );


            for (
                let px = 0;
                px <= width;
                px += step
            ) {

                const wave =
                    Math.sin(
                        px *
                        frequency +
                        this.waveTime *
                        (
                            2 +
                            i *
                            0.5
                        )
                    ) *
                    amplitude;


                const py =
                    baseY +
                    wave;


                if (
                    px === 0
                ) {

                    ctx.moveTo(
                        x + px,
                        py
                    );

                } else {

                    ctx.lineTo(
                        x + px,
                        py
                    );
                }
            }


            ctx.stroke();
        }


        ctx.restore();
    }
}


// ============================================================
// FIM
// ============================================================


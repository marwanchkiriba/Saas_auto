"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let particles: Particle[] = [];
        let mouseX = 0;
        let mouseY = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            color: string;
            pulse: number;
            pulseSpeed: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.pulse = Math.random() * Math.PI * 2;
                this.pulseSpeed = Math.random() * 0.02 + 0.01;
                // Red accent colors
                const colors = [
                    "rgba(220, 38, 38, ",  // Red
                    "rgba(239, 68, 68, ",  // Light red
                    "rgba(185, 28, 28, ",  // Dark red
                    "rgba(255, 255, 255, ", // White
                    "rgba(100, 116, 139, ", // Slate
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.pulse += this.pulseSpeed;

                // Mouse interaction - particles are attracted slightly
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    this.speedX += dx * 0.00005;
                    this.speedY += dy * 0.00005;
                }

                // Boundary wrap
                if (this.x < 0) this.x = canvas!.width;
                if (this.x > canvas!.width) this.x = 0;
                if (this.y < 0) this.y = canvas!.height;
                if (this.y > canvas!.height) this.y = 0;

                // Speed limit
                const maxSpeed = 0.8;
                const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2);
                if (speed > maxSpeed) {
                    this.speedX = (this.speedX / speed) * maxSpeed;
                    this.speedY = (this.speedY / speed) * maxSpeed;
                }
            }

            draw() {
                const pulseOpacity = this.opacity * (0.7 + Math.sin(this.pulse) * 0.3);
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fillStyle = this.color + pulseOpacity + ")";
                ctx!.fill();

                // Glow effect
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                const gradient = ctx!.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 3
                );
                gradient.addColorStop(0, this.color + (pulseOpacity * 0.3) + ")");
                gradient.addColorStop(1, this.color + "0)");
                ctx!.fillStyle = gradient;
                ctx!.fill();
            }
        }

        const init = () => {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < Math.min(particleCount, 100); i++) {
                particles.push(new Particle());
            }
        };

        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.15;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.strokeStyle = `rgba(220, 38, 38, ${opacity})`;
                        ctx!.lineWidth = 0.5;
                        ctx!.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw aurora/gradient waves
            const time = Date.now() * 0.0005;

            // Aurora effect
            for (let i = 0; i < 3; i++) {
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, `hsla(${(time * 20 + i * 40) % 360}, 70%, 50%, 0.02)`);
                gradient.addColorStop(0.5, `hsla(0, 85%, 50%, 0.03)`);
                gradient.addColorStop(1, `hsla(220, 70%, 50%, 0.02)`);

                ctx.beginPath();
                ctx.moveTo(0, canvas.height * 0.3 + Math.sin(time + i) * 100);

                for (let x = 0; x <= canvas.width; x += 50) {
                    const y = canvas.height * 0.3 +
                        Math.sin(time + x * 0.002 + i) * 80 +
                        Math.sin(time * 1.5 + x * 0.001) * 40;
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Update and draw particles
            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            // Draw connections between nearby particles
            drawConnections();

            animationId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        resize();
        init();
        animate();

        window.addEventListener("resize", () => {
            resize();
            init();
        });
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 -z-10 pointer-events-none"
                style={{ background: "linear-gradient(180deg, hsl(220, 15%, 4%) 0%, hsl(220, 20%, 8%) 50%, hsl(220, 15%, 5%) 100%)" }}
            />
            {/* Vignette overlay */}
            <div
                className="fixed inset-0 -z-5 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
                }}
            />
        </>
    );
}

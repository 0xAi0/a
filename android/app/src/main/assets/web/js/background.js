// ── Animated Background Controller ──

export function initBackground() {
    const canvas = document.querySelector('.bg-canvas');
    if (!canvas) return;

    // The CSS handles the initial orbs. This module adds dynamic color shifting
    // by periodically adjusting hue-rotate on the canvas.
    let hue = 0;

    function animateBackground() {
        hue = (hue + 0.05) % 360;
        canvas.style.filter = `hue-rotate(${Math.sin(hue * Math.PI / 180) * 15}deg)`;
        requestAnimationFrame(animateBackground);
    }

    animateBackground();
}

/** Four support paths meeting at the student. Labels stay in HTML so they remain readable. */
export function heroMark(): string {
  const paths = [
    "M78 86 C 170 92, 230 150, 340 258",
    "M602 78 C 510 110, 450 160, 340 258",
    "M64 430 C 150 390, 230 340, 340 258",
    "M608 438 C 520 400, 450 340, 340 258",
  ];
  const drawn = paths.map((d) => `<path class="hero-path" d="${d}"></path>`).join("");
  const flow = paths.map((d) => `<path class="hero-flow" d="${d}"></path>`).join("");
  return `<svg class="hero-mark" viewBox="0 0 680 520" role="img" aria-labelledby="hero-visual-title hero-visual-desc">
    <title id="hero-visual-title">Connected pathways of student support</title>
    <desc id="hero-visual-desc">Insights, care, connection, and support converge on the student at the center.</desc>
    <circle cx="340" cy="258" r="168" fill="#8C1D40" opacity="0.05"></circle>
    <circle class="hero-pulse" cx="340" cy="258" r="128" fill="none" stroke="#FFC627" stroke-width="1.5"></circle>
    <circle cx="340" cy="258" r="112" fill="none" stroke="#8C1D40" stroke-width="1" opacity="0.22"></circle>
    ${drawn}
    ${flow}
    <circle cx="78" cy="86" r="7" fill="#8C1D40"></circle>
    <circle cx="602" cy="78" r="7" fill="#FFC627" stroke="#191919" stroke-width="1.25"></circle>
    <circle cx="64" cy="430" r="7" fill="#8C1D40"></circle>
    <circle cx="608" cy="438" r="7" fill="#FFC627" stroke="#191919" stroke-width="1.25"></circle>
    <circle cx="340" cy="258" r="54" fill="#8C1D40"></circle>
    <circle cx="340" cy="258" r="46" fill="none" stroke="#FFC627" stroke-width="2.5"></circle>
    <circle cx="340" cy="242" r="11" fill="#ffffff"></circle>
    <path d="M316 290c4-20 15-30 24-30s20 10 24 30" fill="#ffffff"></path>
  </svg>`;
}

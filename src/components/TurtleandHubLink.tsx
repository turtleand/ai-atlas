import turtleandMark from "../assets/turtleand-mark.svg";

export function TurtleandHubLink() {
  return (
    <a
      className="atlas-hub"
      href="https://turtleand.com/"
      rel="home"
      aria-label="Turtleand home"
    >
      <img
        className="atlas-hub-mark"
        src={turtleandMark}
        alt=""
        width="37"
        height="37"
      />
      <span>Turtleand <span aria-hidden="true">↗</span></span>
    </a>
  );
}

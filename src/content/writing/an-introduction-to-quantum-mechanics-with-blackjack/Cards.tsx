import { motion, MotionConfig } from "motion/react";
import { useRef } from "react";

export function Cards(props: unknown) {
  const tableEl = useRef<HTMLDivElement | null>(null);
  console.log(props);

  return (
    <MotionConfig transition={{ ease: "easeOut" }}>
      <div
        ref={tableEl}
        style={{ perspective: "1000px" }}
        className="border p-4"
      >
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={tableEl}
          style={{
            transformOrigin: "bottom center",
            boxShadow: "1px 1px 1px 0px #00000050",
          }}
          whileHover={{
            scale: 1.0,
            rotateX: -8,
            // rotateY: 12,
            boxShadow: "3px 0px 3px 1px #00000040",
          }}
          whileTap={{
            scale: 1.1,
            rotateX: 0,
            rotateY: 0,
            boxShadow: "3px 4px 6px 1px #00000020",
          }}
          className="card rounded w-16 border aspect-[5/7] flex items-center justify-center"
        >
          Card
        </motion.div>
      </div>
    </MotionConfig>
  );
}

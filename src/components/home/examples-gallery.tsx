import Image from "next/image";

import type { Messages } from "@/i18n/messages/en";

import styles from "./examples-gallery.module.css";

const examples = [
  { key: "illuminated", src: "/images/example-illuminated-letters.jpg" },
  { key: "cafe", src: "/images/example-cafe-sign.jpg" },
  { key: "lettering3d", src: "/images/example-3d-lettering.jpg" },
  { key: "storefront", src: "/images/example-storefront.jpg" },
] as const;

/**
 * Visual inspiration: four real-world sign styles as illustration. The images are
 * decorative examples of the craft, not output produced by this application.
 */
export function ExamplesGallery({ messages }: { messages: Messages }) {
  const copy = messages.examples;

  return (
    <section id="examples" aria-labelledby="examples-title" className={styles.section}>
      <div className={styles.intro}>
        <h2 id="examples-title" className={styles.title}>
          {copy.title}
        </h2>
        <p className={styles.lead}>{copy.intro}</p>
      </div>

      <ul className={styles.grid}>
        {examples.map(({ key, src }) => (
          <li key={key}>
            <figure className={styles.card}>
              <Image
                src={src}
                alt=""
                width={1280}
                height={960}
                sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 45vw, 90vw"
                className={styles.image}
              />
              <figcaption className={styles.caption}>
                <h3 className={styles.cardTitle}>{copy.items[key].title}</h3>
                <p className={styles.cardText}>{copy.items[key].text}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <p className={styles.note}>{copy.illustrativeNote}</p>
    </section>
  );
}

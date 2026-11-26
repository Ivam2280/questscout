import { motion } from "framer-motion";
import GoogleMapComponent from "../../../components/GoogleMapComponent/GoogleMap";
import HomeSectionHeader from "./HomeSectionHeader";

export default function LocationSection() {
  return (
    <section className="home-section home-location-section">
      <div className="home-location-glow" aria-hidden="true" />
      <div className="home-section-inner home-location-inner">
        <HomeSectionHeader title="Locate" accent="Base" />

        <motion.div
          className="home-location-grid"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          <div className="home-contact-column">
            <article className="home-contact-card home-address-card">
              <p className="home-contact-label qs-condensed">Our Address</p>
              <p className="home-address-primary">Pr. Nauky, 14</p>
              <p className="home-address-secondary">
                Kharkiv, Kharkiv Oblast
                <br />
                Ukraine, 61166
              </p>
              <a
                className="home-contact-action"
                href="https://maps.google.com/?q=пр.+Науки+14+Харків"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions <span aria-hidden="true">↗</span>
              </a>
            </article>

            <div className="home-contact-grid">
              <article className="home-contact-card">
                <p className="home-contact-label qs-condensed">Phone Number</p>
                <a className="home-contact-value" href="tel:+380501234567">
                  +380 50 123 4567
                </a>
              </article>
              <article className="home-contact-card">
                <p className="home-contact-label qs-condensed">Email Address</p>
                <a className="home-contact-value" href="mailto:questscout@gmail.com">
                  questscout@gmail.com
                </a>
              </article>
            </div>
          </div>

          <div className="home-map">
            <div className="home-map-content">
              <GoogleMapComponent />
            </div>
            <div className="home-map-overlay" aria-hidden="true" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

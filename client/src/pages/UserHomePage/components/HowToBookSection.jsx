import { motion } from "framer-motion";
import { CreditCard, MapPin, Search, Settings2, UserCheck } from "lucide-react";
import HomeSectionHeader from "./HomeSectionHeader";

const STEPS = [
  { number: "01", title: "Authorization", icon: UserCheck },
  { number: "02", title: "Select Mission", icon: Search },
  { number: "03", title: "Configuration", icon: Settings2 },
  { number: "04", title: "Payment", icon: CreditCard },
  { number: "05", title: "Arrival", icon: MapPin },
];

export default function HowToBookSection() {
  return (
    <section className="home-section">
      <div className="home-section-inner">
        <HomeSectionHeader
          title="How to"
          accent="Book"
          linkTo="/howtobook"
          linkLabel="Details"
        />

        <ol className="home-steps">
          {STEPS.map(({ number, title, icon: Icon }, index) => (
            <motion.li
              className="home-step"
              key={number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <span className="home-step-icon" aria-hidden="true">
                <Icon size={40} />
              </span>
              <span className="home-step-number qs-display">{number}</span>
              <h3 className="home-step-title qs-condensed">{title}</h3>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

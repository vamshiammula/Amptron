import arrowRight from '../../assets/icons/arrow-right.svg'
import mail from '../../assets/icons/mail.svg'
import mapPin from '../../assets/icons/map-pin.svg'
import menu from '../../assets/icons/menu.svg'
import phone from '../../assets/icons/phone.svg'
import smile from '../../assets/icons/smile.svg'
import users from '../../assets/icons/users.svg'

const sources = {
  'arrow-right': arrowRight,
  'arrow-up-right': arrowRight,
  mail,
  'map-pin': mapPin,
  menu,
  phone,
  smile,
  users,
}

export type IconName = keyof typeof sources

/** Decorative SVG silhouettes inherit the surrounding text colour on every platform. */
export default function Icon({ name }: { name: IconName }) {
  const mask = `url("${sources[name]}")`
  return (
    <span
      className={`ui-icon ui-icon--${name}`}
      aria-hidden="true"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    />
  )
}

import { Select } from 'antd'
import gb from '../assets/flags/gb.svg'
import jp from '../assets/flags/jp.svg'
import vn from '../assets/flags/vn.svg'
import { lang, LANGS, setLang, t, type Lang } from '../i18n'

const FLAG: Record<Lang, string> = { en: gb, vi: vn, ja: jp }

// The flag only decorates: the language name beside it is what gets read out.
const options = LANGS.map(({ value, label }) => ({
  value,
  label: (
    <span className="lang-option">
      <img className="lang-flag" src={FLAG[value]} width={20} height={14} alt="" aria-hidden />
      <span className="lang-name">{label}</span>
    </span>
  ),
}))

/** English, Vietnamese or Japanese. Switching redraws the app in place, with no reload. */
export default function LanguageSelect() {
  return (
    <Select
      className="lang-select"
      value={lang}
      onChange={setLang}
      options={options}
      aria-label={t('Language')}
      popupMatchSelectWidth={false}
    />
  )
}

import { PROFILE } from "../data/profile";

export function SiteNav() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="nav__brand" href="#top" aria-label="回到顶部">
          <span className="nav__mark" aria-hidden="true" />
          <span className="nav__name">{PROFILE.name}</span>
          <span className="nav__role">{PROFILE.role}</span>
        </a>
        <nav className="nav__links" aria-label="站点导航">
          <a href="#ticket-agent">工单智能体</a>
          <a href="#risk-platform">风险预警平台</a>
          <a href="#skills">专业技能</a>
          <a href="#about">关于</a>
        </nav>
        <span className="nav__badge">交互 Demo · 本地模拟</span>
      </div>
    </header>
  );
}

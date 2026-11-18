import { PROFILE } from "../data/profile";

export function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer__inner">
        <div>
          <p className="footer__name">{PROFILE.name}</p>
          <p className="footer__role">
            {PROFILE.role} · {PROFILE.location}
          </p>
        </div>
        <p className="footer__note">
          本站为纯前端交互 Demo：数据为合成样例，检索与调度逻辑在浏览器内真实执行，模型能力由规则模拟。
        </p>
        <p className="footer__build">React · TypeScript · PDF.js · markdown-it</p>
      </div>
    </footer>
  );
}

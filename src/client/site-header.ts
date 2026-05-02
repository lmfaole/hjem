class SiteHeader extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <a href="/">lmfaole.party</a>
      <nav>
        <a href="/cv">CV</a>
      </nav>
    `;
  }
}

customElements.define('site-header', SiteHeader);

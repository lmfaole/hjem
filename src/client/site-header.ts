class SiteHeader extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <a href="/">lmfaole.party</a>
      <nav>
        <a href="/cv">CV</a>
        <a href="https://budsjett.lmfaole.party">Budsjett</a>
      </nav>
    `;
  }
}

customElements.define('site-header', SiteHeader);

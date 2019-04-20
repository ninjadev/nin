class FullscreenRenderTargetPool {
  constructor() {
    this.renderTargets = [];
    this.used = 0;
  }

  _createFullscreenRenderTarget() {
    const [x, y] = PROJECT.aspectRatio.split(':').map(n => +n);
    const renderTarget = new THREE.WebGLRenderTarget(x * GU, y * GU, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    return renderTarget;
  }

  getFullscreenRenderTarget() {
    let renderTarget = this.renderTargets[this.used];
    if(!renderTarget) {
      renderTarget = this._createFullscreenRenderTarget();
      this.renderTargets[this.used] = renderTarget;
    }
    this.used++;
    renderTarget.repeat.set(1, 1);
    renderTarget.offset.set(0, 0);
    return renderTarget;
  }

  withdrawFullscreenRenderTargets() {
    this.used = 0;
  }

  resize() {
    const [x, y] = PROJECT.aspectRatio.split(':').map(n => +n);
    for(let i = 0; i < this.renderTargets.length; i++) {
      this.renderTargets[i].setSize(x * GU, y * GU);
    }
  }
}

module.exports = FullscreenRenderTargetPool;

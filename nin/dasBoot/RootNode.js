(function(NIN) {
  'use strict';

  class RootNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        inputs: {screen: new NIN.TextureInput()}
      });

      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); 
      this.scene = new THREE.Scene();
      this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
      this.scene.add(this.quad);
      this.material = new THREE.MeshBasicMaterial();
    }

    render(renderer) {
      if(renderer.overrideToScreenTexture) {
        this.quad.material = new THREE.MeshBasicMaterial({
          map: renderer.overrideToScreenTexture
        });
      } else {
        var A = this.inputs.screen.getValue();
        this.quad.material = new THREE.MeshBasicMaterial({
          map: A
        });
      }
      renderer.render(this.scene, this.camera);
    }
  }

  NIN.RootNode = RootNode;
})(this.NIN);


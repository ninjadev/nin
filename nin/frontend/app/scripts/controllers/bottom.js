class BottomCtrl {
  constructor($scope, commands, $window) {
    this.commands = commands;
    this.xScale = 1;

    $scope.$watch('main.duration', () => this.updateXScale($scope));
    $window.addEventListener('resize', () => {
      $scope.$apply(() => this.updateXScale($scope));
    });

    this.$window = $window;

    this.loopStart = null;
    this.loopEnd = null;
    this.loopActive = false;
    commands.on('getCuePoint', callback => {
      callback(this.loopActive ? this.loopStart : null);
    });
    commands.on('setCuePoint', () => {
      var currentBEAN = BEAN_FOR_FRAME($scope.main.currentFrame);
      var currentQuantizedFrame = FRAME_FOR_BEAN(currentBEAN - currentBEAN % PROJECT.music.subdivision);
      if (this.loopStart === null) {
        this.loopStart = currentQuantizedFrame;
      } else if (this.loopEnd === null) {
        if (this.loopStart > $scope.main.currentFrame) {
          this.loopEnd = currentQuantizedFrame;
          this.loopStart = currentQuantizedFrame;
        } else {
          this.loopEnd = currentQuantizedFrame;
        }
        this.loopActive = true;
      } else {
        this.loopStart = null;
        this.loopEnd = null;
        this.loopActive = false;
      }
    });

    commands.on('multiplyLoopLengthBy', amount => {
      if (this.loopEnd === undefined || this.loopStart === undefined) {
        return;
      }

      var clampedAmount = Math.max(0, amount),
        loopLength = this.loopEnd - this.loopStart,
        newLoopLength = Math.max(1, loopLength * clampedAmount);

      this.loopEnd = this.loopStart + newLoopLength;
    });

    $scope.$watch('main.currentFrame', nextFrame => {
      if (this.loopActive && nextFrame >= this.loopEnd) {
        commands.jumpToFrame(this.loopStart);
      }
    });
  }

  getClickOffset($event) {
    var target = $('.layers-bar-container')[0];
    var rect = target.getBoundingClientRect();
    var offsetX = ($event.clientX - rect.left) | 0;
    var offsetY = ($event.clientY - rect.top) | 0;
    return {x: offsetX, y: offsetY};
  }

  musicLayerClick($event) {
    this.commands.jumpToFrame(this.getClickOffset($event).x / this.xScale | 0);
  }

  updateXScale($scope) {
    var rect = $('body')[0].getBoundingClientRect();
    this.xScale = rect.width / $scope.main.duration;
  }
}

module.exports = BottomCtrl;

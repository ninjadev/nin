class BottomCtrl {
  constructor($scope, commands, demo) {
    this.xScale = 1;

    this.updateLayerBackgroundGradientStyle($scope);

    $scope.$watch('xScale', () => {
      this.updateLayerBackgroundGradientStyle($scope);
    });

    $scope.$watch('selectedTheme', () => {
      this.updateLayerBackgroundGradientStyle($scope);
    });

    $scope.$watch('main.duration', () => this.updateXScale($scope));
    window.addEventListener('resize', () => {
      $scope.$apply(() => this.updateXScale($scope));
    });

    this.$window = window;

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
        demo.jumpToFrame(this.loopStart);
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
    demo.jumpToFrame(this.getClickOffset($event).x / this.xScale | 0);
  }

  updateLayerBackgroundGradientStyle($scope) {
    if(!$scope.main.selectedTheme) {
      return;
    }
    var wellBgColor;
    var wellBgColorAlt;
    var wellBgBorderColor;
    if($scope.main.selectedTheme == 'dark') {
      wellBgColor = 'rgb(52, 68, 78)';
      wellBgColorAlt = 'rgb(46, 62, 72)';
      wellBgBorderColor = 'rgb(10, 26, 36)';
    } else if($scope.main.selectedTheme == 'light') {
      wellBgColor = '#efefef';
      wellBgColorAlt = '#dfdfdf';
      wellBgBorderColor = '#ababab';
    }

    var beatsPerSecond = PROJECT.music.bpm / 60;
    var secondsPerBeat = 1 / beatsPerSecond;
    var framesPerSecond = 60;
    var framesPerBeat = secondsPerBeat * framesPerSecond;
    var beatWidthInPixels = framesPerBeat * this.xScale;
    var devicePixelRatio = window.devicePixelRatio || 1;

    var entirePatternRepeatCount = 6;
    var backgroundWidth = beatWidthInPixels * 8 * devicePixelRatio;
    var repeatedBackgroundWidth = backgroundWidth * entirePatternRepeatCount;

    var backgroundCanvas = document.createElement('canvas');
    var ctx = backgroundCanvas.getContext('2d');
    backgroundCanvas.width = repeatedBackgroundWidth;
    backgroundCanvas.height = 1;
    for(var i = 0; i < entirePatternRepeatCount; i++) {
      var entirePatternRepeatOffset = i * backgroundWidth;
      ctx.fillStyle = wellBgColor;
      ctx.fillRect(entirePatternRepeatOffset, 0,
                   backgroundWidth, 1);
      ctx.fillStyle = wellBgColorAlt;
      ctx.fillRect(entirePatternRepeatOffset + backgroundWidth / 2, 0,
                   backgroundWidth, 1);
      ctx.fillStyle = wellBgBorderColor;
      for(var j = 0; j < 8; j++) {
        ctx.fillRect(entirePatternRepeatOffset + j * backgroundWidth / 8, 0,
                     1, 1);
      }
    }
    this.backgroundImageDataUrl = backgroundCanvas.toDataURL();
    this.backgroundWidth = repeatedBackgroundWidth / devicePixelRatio;
  }

  updateXScale($scope) {
    var rect = $('body')[0].getBoundingClientRect();
    this.xScale = rect.width / $scope.main.duration;
  }
}

module.exports = BottomCtrl;

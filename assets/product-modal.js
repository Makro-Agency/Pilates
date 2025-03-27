if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
      }

      hide() {
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();
      }

      showActiveMedia() {
        this.querySelectorAll(
          `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute('data-media-id')}"])`
        ).forEach((element) => {
          element.classList.remove('active');
        });
        const activeMedia = this.querySelector(`[data-media-id="${this.openedBy.getAttribute('data-media-id')}"]`);
        const activeMediaIndex = this.querySelector(`[data-index="${this.openedBy.getAttribute('data-current-index')}"]`).dataset.index;
        const activeMediaId = this.querySelector(`[data-media-id="${this.openedBy.getAttribute('data-media-id')}"]`).dataset.index;
        const activeMediaTemplate = activeMedia.querySelector('template');
        const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
        //activeMedia.classList.add('active');
        //activeMedia.scrollIntoView();
        this.querySelector('.product-media-modal__dialog').swiper?.slideTo(Number(activeMediaId)-1);

        const container = this.querySelector('[role="document"]');
        container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;

        if (
          activeMedia.nodeName == 'DEFERRED-MEDIA' &&
          activeMediaContent &&
          activeMediaContent.querySelector('.js-youtube')
        )
          activeMedia.loadContent();
      }
    }
  );
}

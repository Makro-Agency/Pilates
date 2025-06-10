/* To used in count down */
var timeObj = {
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24
}
/* To used in count down */
function addZero(value){  
  temp = (value < 10 ? `0${ value }` : value);  
  return temp;
}

function getESTDate(dateString) {
  // Expected format: "2025-04-17 09:00 AM"
  try {
    const [datePart, timePart, meridiem] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
    let [hours, minutes] = timePart.split(':').map(num => parseInt(num, 10));
    
    // Adjust hours for PM
    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    }
    // Adjust for 12 AM
    if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    // Create date string in EST
    const estDateString = `${year}-${addZero(month)}-${addZero(day)}T${addZero(hours)}:${addZero(minutes)}:00-04:00`;
    
    // First create the date in EST
    const estDate = new Date(estDateString);
    
    // If the browser doesn't support the timezone format, fall back to manual offset calculation
    if (isNaN(estDate.getTime())) {
      const date = new Date(year, month - 1, day, hours, minutes);
      // Get the time difference between local and EST (UTC-4)
      const estOffset = 4 * 60; // EST offset in minutes
      const localOffset = date.getTimezoneOffset();
      const offsetDiff = localOffset - estOffset;
      
      // Adjust the date by the offset difference
      date.setMinutes(date.getMinutes() + offsetDiff);
      return date;
    }
    
    return estDate;
  } catch (e) {
    console.error('Error parsing date:', e);
    return null;
  }
}

function initializeCountdowns() {
  document.querySelectorAll('[data-count-end-date]').forEach(function(element) {
    if(element) {
      callElementCount(element);
      // Remove opacity-0 class from parent banner-content
      const bannerContent = element.closest('.banner-content');
      if(bannerContent && bannerContent.classList.contains('opacity-0')) {
        bannerContent.classList.remove('opacity-0');
      }
    }
  });
}

function callIntervalCountDown(obj){
  if(!obj || !obj.countDown) return;
  
  var intervals = timeObj.minute/7.5;
  var x = setInterval(function() {
    appendCountDown(x, obj);
  }, intervals);
}

function appendCountDown(inverval_var = null, obj){
  if(!obj || !obj.s_id || !document.querySelector(obj.s_id)) return false;
  
  var now = new Date().getTime();
  var hide_ele = document.querySelector(obj.s_id).closest('[data-hide-countdown]');
  var distance = obj.countDown - now;
  
  if(distance <= 0 && inverval_var != null){    
    clearInterval(inverval_var);    
  }

  if(distance <= 0){    
    if(hide_ele) {
      hide_ele.classList.add('hidden');
      if(hide_ele.dataset.preCount == "true"){
        const pre_content = hide_ele.closest('.shopify-section').querySelector('[data-pre-content]');
        if(pre_content){
          const mainContent = hide_ele.closest('[data-main]');
          if(mainContent) {
            mainContent.classList.add('hidden');
            mainContent.remove();
          }

          pre_content.classList.remove('hidden');
          const newCountdown = pre_content.querySelector('[data-count-end-date]');
          if(newCountdown){
            callElementCount(newCountdown);
            
            if(pre_content.dataset.obj) {
              var countDownObj = JSON.parse(pre_content.dataset.obj);
              var hasDistance = appendCountDown(null, countDownObj);
              if(hasDistance) callIntervalCountDown(countDownObj);
              pre_content.removeAttribute('dataset-obj');
            }
          }
        }
      }
    }
    return false;
  } else {
    try {
      var days = Math.floor(distance / (timeObj.day));
      var hours = Math.floor((distance % (timeObj.day)) / (timeObj.hour));
      var minutes = Math.floor((distance % (timeObj.hour)) / (timeObj.minute));
      
      var daysElement = document.querySelector(obj.s_id + ' .days .number');
      var hoursElement = document.querySelector(obj.s_id + ' .hours .number');
      var minElement = document.querySelector(obj.s_id + ' .min .number');
      
      if(daysElement) daysElement.innerText = addZero(days);
      if(hoursElement) hoursElement.innerText = addZero(hours);
      if(minElement) minElement.innerText = addZero(minutes);

      // Remove opacity-0 class if present
      var opacityElement = document.querySelector(obj.s_id).closest('.opacity-0');
      if(opacityElement) {
        opacityElement.classList.remove('opacity-0');
      }
      
      return true;
    } catch(e) {
      console.error('Error updating countdown:', e);
      return false;
    }
  }
}

function callElementCount(element){
  if(!element || !element.dataset.countEndDate) return;
  
  try {
    const parsedDate = getESTDate(element.dataset.countEndDate.trim());
    if(!parsedDate || isNaN(parsedDate.getTime())) {
      console.error('Invalid date format:', element.dataset.countEndDate);
      return;
    }
    
    var selector = element.querySelector('[data-selector]');
    if(!selector) return;
    
    var countDownObj = {
      countDown: parsedDate.getTime(),
      s_id: "#" + selector.id
    };
    
    if(!element.closest('[data-pre-content]')) {
      var hasDistance = appendCountDown(null, countDownObj);
      if(hasDistance) callIntervalCountDown(countDownObj);
    } else {
      element.closest('[data-pre-content]').dataset.obj = JSON.stringify(countDownObj);
    }
  } catch(e) {
    console.error('Error in callElementCount:', e);
  }
}

// Initialize countdowns when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeCountdowns();
});

// Re-initialize countdowns when Shopify section is loaded (for theme editor)
if(Shopify.designMode) {
  document.addEventListener('shopify:section:load', function(event) {
    initializeCountdowns();
  });
}

$(function() {
  

  /* Home page */
  if($('body').hasClass('template-index')){
    homeEventGallerySlider();
  }
  /* Home page */

  //section -- banner-with-classes
  $('.banner-with-classes .classes-lists-wrap [data-name]').hover(
    function() {
      let getName = $(this).attr('data-name');
      $(this).closest('.banner-with-classes').find(`.banner__media`).removeClass('active-img');
      $(this).closest('.banner-with-classes').find(`.banner__media[data-name="${getName}"]`).addClass('active-img');
    }, function() {
      $(this).closest('.banner-with-classes').find(`.banner__media`).removeClass('active-img');
      let firstChildName = $(this).closest('.banner-with-classes').find(`.banner__media:first-child`).attr('data-name');
      $(this).closest('.banner-with-classes').find(`.banner__media[data-name="${firstChildName}"]`).addClass('active-img');
    }
  );
  //section -- banner-with-classes
  
  
  /* Product page */
  if($('body').hasClass('template-product')){
    productMediaGallery();
    productMediaModalSlider();
    productAccrodion();
  }
  /* Product page */

  /* contact-us template */
  if($('body').hasClass('template--contact-us')){
    $('.scMap-tab .scMap-tab-title:not(.comeSoon)').click(function (event) {
    var _this = $(this);
    var currentAttr = $(this).parent().attr('data-location');
      
    if( $(this).parent().hasClass('active') ){     
      $(this).next().slideUp(150, function () {
        _this.parent().removeClass('active');
      });
      $('.wrapper .map').removeClass('active');
      _this.closest('.wrapper').find('.map:first-child').addClass('active');
    }else{
      var _sibling = $(this).parent().siblings('.active');
      $(_sibling).find('.tabWrapper').slideUp(250, function(){
        $(_sibling).removeClass('active');
      });      
      $(this).next().slideDown(250, function(){
        _this.parent().addClass('active');
      });
      $('.wrapper .map').removeClass('active');
      $(this).closest('.wrapper').find(`.map[data-location="${currentAttr}"]`).addClass('active');
    }
  });
    $('.tabt-link-title').click(function (event) {
    var _id = $(this).attr('data-id');
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    if( $('#'+_id).length > 0 ){
      $('#'+_id).addClass('active');
      $('#'+_id).siblings().removeClass('active');
    }
  });
  }
  /* contact-us template */

  
  /*Team template page*/
  if($('body').hasClass('template--team')){
    $(document).on('click','[data-team-filter-btn] [data-tags]',function(e) {
      e.preventDefault();
      if($(this).hasClass('active')) return;
      $('[data-team-filter-btn] [data-tags]').removeClass('active');
      $(this).addClass('active');
      let currentTag = $(this).attr('data-tags');
      $('[data-profile] [data-tags]').hide();
      if(currentTag == 'all'){
        $('[data-profile] [data-tags]').fadeIn(450);
      }else{
        $('[data-profile] [data-tags]').filter(function(){
          if($(this).attr('data-tags').indexOf(currentTag) > -1){
            $(this).fadeIn(450);
          }
        });
      }
    });
  }
  /*Team template page*/


  /*Press template page*/
  if($('body').hasClass('template--press')){
    $(document).on('click','[data-year-filter-btn] [data-year]',function(e) {
      e.preventDefault();
      if($(this).hasClass('active')) return;
      $('[data-year-filter-btn] [data-year]').removeClass('active');
      $(this).addClass('active');
      let currentTag = $(this).attr('data-year');
      $('[data-news-col] [data-date]').hide();
      if(currentTag == 'all'){
        $('[data-news-col] [data-date]').fadeIn(450);
      }else{
        $('[data-news-col] [data-date]').filter(function(){
          if($(this).attr('data-date').indexOf(currentTag) > -1){
            $(this).fadeIn(450);
          }
        });
      }
    });
  }
  /*Press template page*/
  
  /*Event space rental template page*/
  if($('body').hasClass('template--event-space-rental')){
    imageGallerySlider();
  }
  /*Event space rental template page*/

  /* Spa service new template page */
  if($('body').hasClass('template--spa-service-new')){
    spaMulticolumnSlider();
    allServicesCardFn()
  }
  /* Spa service new template page */

  /*Event template diversity*/
  if($('[data-grid--img-slider]').length > 0){  
    secImgSlider();
  }
  /*Event template diversity*/  

  /*hit page template*/
  if($('.hit-hero [data-scroll-next]').length > 0){
    $(document).on('click', '.hit-hero [data-scroll-next]', function(e){
      e.preventDefault();
      $('html, body').animate({
        scrollTop: $('main section:nth-child(2)').offset().top
      }, 450);
    });
  }
  if($('.hit-classes [data-class-item]').length > 0){
    hitClassesAccrodion();
  }
  /*hit page template*/  

  /*location page template*/
  if($('body').hasClass('template--locations')){
    locationPageSlider();
  }
  /*location page template*/

  /*about us page template*/
  if($('body').hasClass('template--about-us')){
    setTimeout(function(){
      getServiceBoxHeight();
    },1000);
  }
  /*about us page template*/

  /*services page template*/
  if($('body').hasClass('template--services') || $('body').hasClass('template--cryotherapy')){
    $(document).on('click', '.services-hero [data-scroll-next]', function(e){
      e.preventDefault();
      $('html, body').animate({
        scrollTop: $('.services-multirow').offset().top
      }, 600);
    });

    servicesPageFAQAccrodion();
  } else if ( $('.services-faq-accordion').length ) {
    servicesPageFAQAccrodion();
  } else {
    
  }
  /*services page template*/
  

  /*tonic house page template*/
  if($('body').hasClass('template--tonic-house')){
    tonicHousePageSlider();
    tonicBookingSlider();
    
    $(document).on('click', '.tonic-welcome-wrapper [data-scroll-next]', function(e){
      e.preventDefault();
      $('html, body').animate({
        scrollTop: $('.topic-locations-wrapper').offset().top
      }, 600);
    });
  }
  /*tonic house page template*/
  
  /*Footer section*/
  footerAccrodion();
  /* Footer section */

  /* global_linklist */
  $(document).on('click', '.link-list a.scroll', function(event){    
    var href = $(this).attr('href');
    if( href.length > 1 ){
      event.preventDefault();
      $('html, body').animate({
        scrollTop: $(href).offset().top
      }, 500);
    }
  })
  /* global_linklist */
  
});


//Full page load event START
$(window).on("load", function() {
  
  if($('body').hasClass('template-index')){
    optimiseHeroBannerVideoSection();
  }
  
  if($('body').hasClass('template--about-us')){
    setTimeout(function(){
      getServiceBoxHeight();
    },1000);
  }  
});
//Full page load event END



function optimiseHeroBannerVideoSection(){
  const nodeEle = document.querySelector('.home-hero .banner__media');
  const videoEle = document.querySelectorAll('.home-hero template');
  if(!videoEle.length) return;

  for(let i=0; i<videoEle.length; i++){
    const content = document.createElement('div');
    content.appendChild(videoEle[i].content.firstElementChild.cloneNode(true));  
    const deferredElement = nodeEle.appendChild(content.querySelector('video, iframe'));
    if (deferredElement.nodeName == 'VIDEO') {
      deferredElement.play(); // force autoplay for safari
    }
  }
  setTimeout(() => {
    nodeEle.querySelectorAll('img').forEach(e => e.classList.add('hidden'));
  },1500)
}

function homeEventGallerySlider(){
  if(document.querySelector('.home-event-gallery-slider [data-home-event-gallery-slider]')){
    var swiper = new Swiper('[data-home-event-gallery-slider]', {
      slidesPerView: 1.3,
      slidesPerGroup: 1,
      freeMode: true,
      speed: 800,
      navigation: {
        nextEl: '.home-event-gallery-slider .swiper-button-next',
        prevEl: '.home-event-gallery-slider .swiper-button-prev'
      },
      breakpoints: {
        750: {
          slidesPerView: 2.5,
          slidesPerGroup: 2,
          loop: true,
          freeMode: false
        },
        990: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          loop: true,
          freeMode: false
        },
        1200: {
          slidesPerView: 4,
          slidesPerGroup: 4,
          loop: true,
          freeMode: false
        }
      }
    });
  }
}

function imageGallerySlider(){
  if(document.querySelector('.event-gallery-slider [data-event-gallery-slider]')){
    var swiper = new Swiper('[data-event-gallery-slider]', {
      slidesPerView: 1.2,
      slidesPerGroup: 1,
      spaceBetween: 10,
      freeMode: true,
      speed: 600,
      navigation: {
        nextEl: '.event-gallery-slider .swiper-button-next',
        prevEl: '.event-gallery-slider .swiper-button-prev'
      },
      breakpoints: {
        750: {
          slidesPerView: 1.5,
          freeMode: false
        },
        990: {
          slidesPerView: 2.2,
          spaceBetween: 20,
          freeMode: false
        }
      }
    });
  }
}

function spaMulticolumnSlider(){
  if(document.querySelector('.spa-multicolumn [data-spa-multicolumn-slider]')){
    var swiper = new Swiper('[data-spa-multicolumn-slider]', {
      slidesPerView: 1.2,
      slidesPerGroup: 1,
      spaceBetween: 10,
      freeMode: false,
      speed: 600,
      loop: true,
      navigation: {
        nextEl: '.spa-multicolumn .swiper-button-next',
        prevEl: '.spa-multicolumn .swiper-button-prev'
      },
      breakpoints: {
        750: {
          slidesPerView: 2.3,
          spaceBetween: 20
        },
        990: {
          slidesPerView: 2.8,
          spaceBetween: 20
        }
      }
    });
  }
}

function allServicesCardFn() {

  //service card description hight calc
  $(`.spa-all-services .spa-services-list .spa-services-box .text-wrap > p`).each(function(index,val) {
    if($(this).outerHeight(true) > 96){
      $(this).css('max-height','96px');
      $(this).closest('.text-wrap').find('[description-read-more]').removeClass('hidden')
    }
  });

  //read more card description btn click
  $(document).on('click', '.spa-all-services .spa-services-list [description-read-more]', function(e) {
    e.preventDefault();
    $(this).closest('.text-wrap').find('p').css('max-height','100%');
    $(this).addClass('hidden');
    $(this).closest('div').find('.text-wrap-less').removeClass('hidden')
  });

  //read less card description btn click
  $(document).on('click', '.spa-all-services .spa-services-list [description-read-less]', function(e) {
    e.preventDefault();
    $(this).closest('.text-wrap').find('p').css('max-height','96px');
    $(this).addClass('hidden');
    $(this).closest('div').find('.text-wrap-more').removeClass('hidden');
  });
  
  //when card location link clicked
  $(document).on('click', '[data-location] [data-location-link]', function(e) {
    e.preventDefault();
    $(this).closest('[data-location]').addClass('location-expand');
    $(this).closest('[data-location]').find('.hover-box').removeClass('hover-box');
  });

  //location filter dropdown clicked
  $(document).on('click', '.spa-all-services [data-location-options] [data-selected-location]', function(e) {
    e.preventDefault();
    $(this).closest('.select-div').toggleClass('active');
  });
  $(document).on('click', '.spa-all-services [data-location-options] li', function(e) {
    e.preventDefault();
    let value = $(this).text();
    let currentService = $('.spa-all-services [data-service-options] li.active').attr('data-value');
    let selectedLoc = $(this).attr('data-value');
    if(!selectedLoc) value = `${value} locations`;
    $(this).closest('.select-div').toggleClass('active');
    $(this).closest('[data-location-options]').find('[data-selected-location]').text(value);
    $('.spa-all-services [data-location-options] li').removeClass('active');
    $(this).addClass('active');
    $(this).closest('.select-div').removeClass('active');
    filterResult(currentService,selectedLoc);
  });
  $(document).on('click', function(event){
    if( $('.spa-services-head .select-div.active').length > 0 && $(event.target).closest('.select-div').length == 0 ){
      $('.spa-services-head .select-div.active').removeClass('active');
    }
  });
  

  //spa service & location filter
  $(document).on('click', '.spa-all-services [data-service-options] li', function(e) {
    e.preventDefault();
    let activeService = $(this).attr('data-value');
    let activeLocation = $('.spa-all-services [data-location-options] li.active').attr('data-value');
    $('.spa-all-services [data-service-options] li').removeClass('active');
    $(this).addClass('active');
    filterResult(activeService,activeLocation);
  });

  
  function filterResult(serviceType,locatioName) {
    $(`.spa-all-services .spa-services-list .spa-services-box`).addClass('hidden');
    if(serviceType && !locatioName){
      $(`.spa-all-services .spa-services-list [data-service-type*="${serviceType}"]`).removeClass('hidden');
    }else if(!serviceType && locatioName){
      $(`.spa-all-services .spa-services-list [data-location*="${locatioName}"]`).removeClass('hidden');  
    }else if(serviceType && locatioName){
      $(`.spa-all-services .spa-services-list [data-service-type*="${serviceType}"][data-location*="${locatioName}"]`).removeClass('hidden');
    }else{
      $(`.spa-all-services .spa-services-list .spa-services-box`).removeClass('hidden'); 
    }
    let totalListCount = $(`.spa-all-services .spa-services-list .spa-services-box:not(.hidden)`).length;
    $(`.spa-all-services [total-service-count]`).text(`(${totalListCount})`);
  }
  
}

/* Function for Redirect To the Services Portion */
function ScrollToServices() {
  const Scrollelement = document.querySelector('.spa-all-services');
  if(Scrollelement){
    var Scrollposition = Scrollelement.offsetTop - 80;
    window.scrollTo({ top: Scrollposition, behavior: 'smooth'});
  }
}
/* ScrollServices Function Code Ended */


function productMediaGallery() {

  // breakpoint where swiper will be default for mobile layout
  let breakpoint = window.matchMedia('(max-width: 749px)');

  let gallerySwiperInit, thumbSwiperInit; // keep track of swiper instances to destroy later
  const enableGallerySwiper = function(thumbEle,mainEle) {
    
    if(thumbEle){
      thumbSwiperInit = new Swiper(thumbEle, {
        spaceBetween: 20,
        slidesPerView: "auto",
        freeMode: false,
        watchSlidesProgress: true
      });
    }

    if(mainEle){
      gallerySwiperInit = new Swiper(mainEle, {
        effect: 'fade',
        navigation: {
          nextEl: '[data-gallery-slider] .swiper-button-next',
          prevEl: '[data-gallery-slider] .swiper-button-prev'
        },
        thumbs: {
          swiper: thumbSwiperInit ? thumbSwiperInit : null
        },
        on: {
          transitionStart: function(){
            const allVideos = [...mainEle.querySelectorAll('video, iframe')];
            if(allVideos.length) window.pauseAllMedia();
          },
          
          transitionEnd: function(){
            const activeIndex = gallerySwiperInit.activeIndex;
            const activeSlide = mainEle.querySelectorAll('.swiper-slide')[activeIndex];
            const activeSlideVideo = activeSlide.getElementsByTagName('video')[0];
            if(activeSlideVideo) activeSlideVideo.play();
            //for external video
            const activeSlideIframe = activeSlide.getElementsByTagName('iframe')[0];
            if(activeSlideIframe){
              let iframeSrc = activeSlideIframe.getAttribute('src');
              if(iframeSrc.includes('?autoplay=0')){
                let newSrc = iframeSrc.replace('?autoplay=0','?autoplay=1&muted=1');
                activeSlideIframe.setAttribute('src',newSrc);
              }
              if(iframeSrc.includes('vimeo.com')){
                activeSlideIframe.contentWindow.postMessage('{"method":"play"}', '*');
              }else{
                activeSlideIframe.contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
              }
            }
          }
        }
      });
    }

  };

  const breakpointChecker = function() {
    let gallerySwiper = document.querySelector('[data-desktop-layout="carousel"] [data-gallery-slider]');
    let thumbSwiper = document.querySelector('[data-thumbnail-slider]');
    if (breakpoint.matches) {
      gallerySwiper = document.querySelector('[data-gallery-slider]'); // slider is default for mobile screen
      gallerySwiper.querySelector('.product__media-list').classList.remove('grid');
      return enableGallerySwiper(thumbSwiper,gallerySwiper);
    } else if (breakpoint.matches === false) {
      if(gallerySwiper){
        document.querySelector('[data-gallery-slider] .product__media-list').classList.remove('grid');
        return enableGallerySwiper(thumbSwiper,gallerySwiper);
      }else{
        if (gallerySwiperInit !== undefined) gallerySwiperInit.destroy(true, true);
        document.querySelector('[data-gallery-slider] .product__media-list').classList.add('grid');
        return;
      }
    }
  };
  
  breakpoint.addListener(breakpointChecker); // keep an eye on viewport size changes
  breakpointChecker(); // call on-load
  
}

function productMediaModalSlider(){
  let productMediaModal = document.querySelector('[data-media-modal-slider]');
  if(productMediaModal){
    let mediaModalSliderInit = new Swiper(productMediaModal, {
      effect: 'fade',
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
      },
      on: {
        transitionStart: function(){
          const allVideos = [...document.querySelectorAll('[data-media-modal-slider] video, [data-media-modal-slider] iframe')];
          if(allVideos.length) window.pauseAllMedia();
        },
        
        transitionEnd: function(){
          const activeIndex = this.activeIndex;
          const activeSlide = document.querySelectorAll('[data-media-modal-slider] .swiper-slide')[activeIndex];
          const activeSlideVideo = activeSlide.getElementsByTagName('video')[0];
          if(activeSlideVideo) activeSlideVideo.play();
          //for external video
          const activeSlideIframe = activeSlide.getElementsByTagName('iframe')[0];
          if(activeSlideIframe){
            let iframeSrc = activeSlideIframe.getAttribute('src');
            if(iframeSrc.includes('?autoplay=0')){
              let newSrc = iframeSrc.replace('?autoplay=0','?autoplay=1&muted=1');
              activeSlideIframe.setAttribute('src',newSrc);
            }
            if(iframeSrc.includes('vimeo.com')){
              activeSlideIframe.contentWindow.postMessage('{"method":"play"}', '*');
            }else{
              activeSlideIframe.contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
            }
          }
        }
      }
    });
  }
}

function productAccrodion(){
  $(document).on('click','[data-accrodion-block] [data-accrodion-tab]', function (e) {
    e.preventDefault();
    if($(this).hasClass('active')){
      $(this).removeClass('active');
      $(this).next().slideUp(450);
    }else{
      $(this).closest('[data-accrodion-block]').find('.panel').slideUp(450);
      $(this).closest('[data-accrodion-block]').find('.active').removeClass('active');
      $(this).addClass('active');
      $(this).next().slideToggle(450);
    }
  });
}

function footerAccrodion() {
  $(document).on('click','.footer-blocks-menu-links [data-link-title]', function (e) {
    e.preventDefault();
    if($(this).closest('.footer-block--menu').hasClass('active')){
      $(this).closest('.footer-block--menu').removeClass('active');
      $(this).next().slideUp(450);
    }else{
      $(this).closest('.footer-blocks-menu-links').find('[data-link-content]').slideUp(450);
      $(this).closest('.footer-blocks-menu-links').find('.active').removeClass('active');
      $(this).closest('.footer-block--menu').addClass('active');
      $(this).next().slideToggle(450);
    }
  });
}

function hitClassesAccrodion() {
  //accordion
  $(document).on('click','.hit-classes [data-class-item]', function (e) {
    e.preventDefault();
    if($(this).hasClass('active')){
      $(this).removeClass('active');
      $(this).next().slideUp(450);
    }else{
      $(this).closest('.hit-classes-table').find('[data-class-content]').slideUp(450);
      $(this).closest('.hit-classes-table').find('.active').removeClass('active');
      $(this).addClass('active');
      $(this).next().slideToggle(450);
    }
  });

  //show-more accordion
  $(document).on('click','.hit-classes [data-hit-classes] [data-total-show]', function (e) {
    e.preventDefault();
    let totalHideList = $(this).closest('.hit-classes-table-wrap').find('.show-more-box');
    console.log('totalHideList >>',totalHideList)
    let toShow = Number($(this).attr('data-show'));
    let totalShow = Number($(this).attr('data-total-show'));
    let remain = totalShow - toShow;

    if(totalShow > toShow){
      $(this).attr('data-total-show',remain);
      $(totalHideList).each(function(index){
        if(index < toShow ){
          $(totalHideList).eq(index).slideDown(400);
        }
      });
      $(this).text(`+ ${remain} MORE`);
    }else{
      $(this).closest('.hit-classes-table-wrap').find('.show-more-box').slideDown(400);
      $(this).closest('[data-hit-classes]').addClass('hidden');
      $(this).attr('data-total-show',0);
      $(this).text(`NO MORE LIST`);
    }
  });
  
  $(document).on('click','.hit-classes [data-hit-classes] [data-show-all]', function (e) {
    e.preventDefault();
    $(this).closest('.hit-classes-table-wrap').find('.show-more-box').slideDown(450);
    $(this).closest('[data-hit-classes]').addClass('hidden');
  });
  
}

function secImgSlider(){
  /*section-image-slider*/
  if(document.querySelector('[data-grid--img-slider]')){
    var swiper = new Swiper('[data-grid--img-slider]', {
      slidesPerView: 1.2,
      slidesPerGroup: 1,
      spaceBetween: 10, 
      freeMode: true,
      speed: 600,
      navigation: {
        nextEl: '[data-grid--img-slider] .swiper-button-next',
        prevEl: '[data-grid--img-slider] .swiper-button-prev'
      },
      breakpoints: {
        750: {
          slidesPerView: 2,
          spaceBetween: 10,
          freeMode: false
        },
        1024: {          
          slidesPerView: 2,
          spaceBetween: 20,
          freeMode: false
        }
      }
    });
  }
}

function locationPageSlider(){
  if(document.querySelector('.locations-wrapper .location-slide')){
    var swiper = new Swiper(".location-slide", {
      slidesPerView: "auto",
      spaceBetween: 10,
      pagination: {
        el: ".swiper-pagination",
        type: "fraction"
      },
      navigation: {
        nextEl: ".loca-button-next",
        prevEl: ".loca-button-prev"
      },
      breakpoints: {    
        749: {
          slidesPerView: "auto",
          spaceBetween: 0
        }
      }
    });
  }
}

function tonicHousePageSlider(){
  if(document.querySelector('.tonic-slider-wrapper [data-tonic-slider]')){
    var swiper = new Swiper("[data-tonic-slider]", {
      slidesPerView: "auto",
      spaceBetween: 5,
      pagination: {
        el: ".swiper-pagination",
        clickable: true
      },
      navigation: {
        nextEl: ".tonic-button-next",
        prevEl: ".tonic-button-prev"
      },
      breakpoints: {    
        749: {
          slidesPerView: "auto",
          spaceBetween: 0
        }
      }
    });
  }
}

function tonicBookingSlider() {

  // breakpoint where swiper will be destory or init based on section settings
  let breakpoint = window.matchMedia('(max-width: 749px)');

  const carouselEle = document.querySelector('.tonic-bookings-wrapper [data-slider-ele]');
  if(!carouselEle) return;
  const section_settings = JSON.parse(document.querySelector('.tonic-bookings-wrapper [data-slider-ele]').getAttribute('data-section-settings') || '[]');
  
  let mySwiper; // keep track of swiper instances to destroy later
  
  const enableSwiper = function() {
    mySwiper = new Swiper (carouselEle, {
      slidesPerView: 1.1,
      spaceBetween: 20,
      navigation: {
        nextEl: '.tonic-booking-button-next',
        prevEl: '.tonic-booking-button-prev'
      },
      breakpoints: {
        1200: {
          slidesPerView: 2,
          slidesPerGroup: 1,
          spaceBetween: 40
        }
      }
    });
  };

  const breakpointChecker = function() {
    if (breakpoint.matches && !section_settings.enable_mobile_slider) {
      //destroy mobile slider
      if (mySwiper !== undefined) mySwiper.destroy(true, true);
      document.querySelector('.tonic-bookings-wrapper [data-slider-ele] .book-wrapper-element').classList.remove('swiper-wrapper');
      return;
    } else if (breakpoint.matches && section_settings.enable_mobile_slider) {
      //build mobile slider
      document.querySelector('.tonic-bookings-wrapper [data-slider-ele] .book-wrapper-element').classList.add('swiper-wrapper');
      return enableSwiper();
    } else if (breakpoint.matches === false && section_settings.enable_desktop_slider) {
      //build desktop slider
      document.querySelector('.tonic-bookings-wrapper [data-slider-ele] .book-wrapper-element').classList.add('swiper-wrapper');
      return enableSwiper();
    }
  };
    
  breakpoint.addListener(breakpointChecker); // keep an eye on viewport size changes
  breakpointChecker(); // call on-load
  
}

function servicesPageFAQAccrodion() {
  //accordion
  $(document).on('click','.services-faq [data-class-item]', function (e) {
    e.preventDefault();
    if($(this).hasClass('active')){
      $(this).removeClass('active');
      $(this).next().slideUp(450);
    }else{
      $(this).closest('.services-faq-accordion').find('[data-class-content]').slideUp(450);
      $(this).closest('.services-faq-accordion').find('.active').removeClass('active');
      $(this).addClass('active');
      $(this).next().slideToggle(450);
    }
  });
}

function getServiceBoxHeight(){
  var getHeight = 0;
  $('.service-main-box .service-item').each(function(index,ele) {
     $(ele).find('.cont-wrapper div.texts').css('min-height','');
    var curr_height = $(ele).find('.cont-wrapper div.texts').outerHeight(true);
    if(curr_height > getHeight){
      getHeight = curr_height;
    }
  });
   $('.service-main-box .service-item').each(function(index,ele) {
     $(ele).find('.cont-wrapper div.texts').css('min-height',`${getHeight}px`);
   });
}

function openPanel(ele) {
  document.querySelector('.mobile-service-filter').classList.add('menu-opening');
}

function closePanel(ele){
  document.querySelector('.mobile-service-filter').classList.remove('menu-opening');
}

function open_accordian(ele){
  ele.closest('.mobile_filter_details').classList.toggle('open-tab');
}

class productCarousel extends HTMLElement{
   constructor() {
    super();
  }

  connectedCallback(){
    const product_carousel = this.querySelector('[data-product-carousel]');
    const product_carousel_mobile = this.querySelector('[data-mobile-swipe-enable]');
    
    if(!product_carousel) return;

    const prevArrow = this.querySelector('.swiper-button-prev');
    const nextArrow = this.querySelector('.swiper-button-next');
    const mainEle = product_carousel.querySelector('[id^="Slider-"]');
    const mainEleCard = product_carousel.querySelectorAll('[id^="Slide-"]');
    // breakpoint where swiper will be destroyed
    const breakpoint = window.matchMedia('(max-width: 749px)');
    
    let mySwiper; // keep track of swiper instances to destroy later

    const enableSwiper = function() {
      mySwiper = new Swiper (product_carousel, {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 20,
        speed: 900,
        navigation: {
          nextEl: nextArrow,
          prevEl: prevArrow
        },
        breakpoints: {
          1200: {
            slidesPerView: 4,
            slidesPerGroup: 4,
            spaceBetween: 40
          }
        }
      });
    };
    
    const breakpointChecker = function() {
      // if smaller viewport and multi-row/native css slider layout needed
      if (breakpoint.matches) {
        if (mySwiper !== undefined) mySwiper.destroy(true, true);
        if(mainEle) mainEle.classList.add('grid','contains-card--product');
        if(mainEleCard.length) mainEleCard.forEach((ele,index) => {
          if(index >= 4 && !product_carousel_mobile){
            ele.classList.add('grid__item', 'hidden');
          }else{
            ele.classList.add('grid__item');
          }
        });
        return;
      } else if (breakpoint.matches === false) {
        if(mainEle) mainEle.classList.remove('grid','contains-card--product');
        if(mainEleCard.length) mainEleCard.forEach(ele => ele.classList.remove('grid__item','hidden'));
        return enableSwiper();
      }
    };
    
    breakpoint.addListener(breakpointChecker); // keep an eye on viewport size changes
    breakpointChecker(); // call on-load
  }
  
}
customElements.define('product-carousel', productCarousel);


/* ***This will only render in the theme editor***** */
if (Shopify.designMode) {
   document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener('shopify:section:load', function(){

      //Home page hero section
      const homeHeroSection = event.target.closest(".home-hero") || null;
      if (homeHeroSection) {
        optimiseHeroBannerVideoSection();
      }
      
      //Home page event gallery section
      const homeImageGallary = event.target.closest(".home-event-gallery-slider") || null;
      if (homeImageGallary) {
        homeEventGallerySlider();
      }
      
      // product media gallary section
      const productMediaGallary = event.target.closest(".main-product-section") || null;
      if (productMediaGallary) {
        productMediaGallery();
        productMediaModalSlider();
        productAccrodion();
      }
      
      // event template page
      const imageGallary = event.target.closest(".event-gallery-slider") || null;
      if (imageGallary) {
        imageGallerySlider();
      }

      // Spa template page
      const spaMulticolumn = event.target.closest(".spa-multicolumn") || null;
      if (spaMulticolumn) {
        spaMulticolumnSlider();
      }
      const spaAllServices = event.target.closest(".spa-all-services") || null;
      if (spaAllServices) {
        allServicesCardFn();
      }

      //tonic house page template
      const tonicImageGallary = event.target.closest(".tonic-slider-wrapper") || null;
      if (tonicImageGallary) {
        tonicHousePageSlider();
      }
      const tonicBookingSliderEle = event.target.closest(".tonic-bookings-wrapper") || null;
      if (tonicBookingSliderEle) {
        tonicBookingSlider();
      }
      
      document.querySelectorAll('.banner-content.opacity-0').forEach(function(element){
        element.classList.remove('opacity-0');
      });
      
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const toggles = document.querySelectorAll('.mobile-toggle, .toggle-wrap');
  
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      // Prevent event bubbling
      e.stopPropagation();
      
      // Find dropdown content - either directly nested or using selector
      const dropdownContent = this.closest('.mobile-toggle').querySelector('.dropdown-content');
      
      // Toggle with smooth animation
      if (dropdownContent) {
        // Toggle active state
        this.classList.toggle('active');
        
        if (dropdownContent.classList.contains('open')) {
          // Close animation
          dropdownContent.style.maxHeight = (dropdownContent.scrollHeight + 30) + 'px';
          // Force reflow
          void dropdownContent.offsetWidth;
          dropdownContent.style.maxHeight = '0';
          dropdownContent.style.opacity = '0';
          
          // Remove class after animation completes
          setTimeout(() => {
            dropdownContent.classList.remove('open');
          }, 300);
        } else {
          // Open animation
          dropdownContent.classList.add('open');
          dropdownContent.style.maxHeight = '0';
          dropdownContent.style.opacity = '0';
          
          // Force reflow
          void dropdownContent.offsetWidth;
          dropdownContent.style.maxHeight = (dropdownContent.scrollHeight + 30) + 'px';
          dropdownContent.style.opacity = '1';
        }
        
        if(this.querySelector('.toggle-wrap.active')){
          this.querySelector('.toggle-wrap.active').classList.toggle('active');
        }
      }
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const openDropdowns = document.querySelectorAll('.dropdown-content.open');
    openDropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target) && !e.target.classList.contains('mobile-toggle')) {
        // Close animation
        dropdown.style.maxHeight = '0';
        dropdown.style.opacity = '0';
        
        // Remove active class from toggle
        const parentToggle = dropdown.closest('.mobile-toggle');
        if (parentToggle) parentToggle.classList.remove('active');
        
        // Remove open class after animation
        setTimeout(() => {
          dropdown.classList.remove('open');
        }, 300);
      }
    });
  });
});
/**
 * ELEN Coffee — front-end behaviour.
 * No framework, no bundler: one small vanilla-JS file, loaded deferred.
 * Every animation here only toggles a class; the actual transform/opacity
 * transition lives in CSS so the browser can run it on the compositor.
 */
(function () {
	'use strict';

	var prefersReducedMotion = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	/* ---------------------------------------------------------------------
	 * Mobile primary nav
	 * ------------------------------------------------------------------- */
	var navToggle = document.querySelector( '.site-header__menu-toggle' );
	var nav = document.getElementById( 'primary-menu' );
	if ( navToggle && nav ) {
		navToggle.addEventListener( 'click', function () {
			var expanded = navToggle.getAttribute( 'aria-expanded' ) === 'true';
			navToggle.setAttribute( 'aria-expanded', String( ! expanded ) );
			nav.classList.toggle( 'is-open', ! expanded );
			document.body.style.overflow = ! expanded ? 'hidden' : '';
		} );
	}

	/* ---------------------------------------------------------------------
	 * Mobile shop filters drawer
	 * ------------------------------------------------------------------- */
	var filterToggle = document.querySelector( '.shop-toolbar__filter-toggle' );
	var filterPanel = document.getElementById( 'shop-filters' );
	var filterClose = document.querySelector( '.shop-filters__close' );

	function closeFilters() {
		if ( ! filterPanel ) return;
		filterPanel.classList.remove( 'is-open' );
		if ( filterToggle ) filterToggle.setAttribute( 'aria-expanded', 'false' );
		document.body.style.overflow = '';
	}

	if ( filterToggle && filterPanel ) {
		filterToggle.addEventListener( 'click', function () {
			var isOpen = filterPanel.classList.toggle( 'is-open' );
			filterToggle.setAttribute( 'aria-expanded', String( isOpen ) );
			document.body.style.overflow = isOpen ? 'hidden' : '';
		} );
	}
	if ( filterClose ) {
		filterClose.addEventListener( 'click', closeFilters );
	}

	/* ---------------------------------------------------------------------
	 * Mini-cart drawer
	 * ------------------------------------------------------------------- */
	var drawer = document.getElementById( 'mini-cart-drawer' );
	var openTriggers = document.querySelectorAll( '[data-cart-open]' );
	var closeTriggers = drawer ? drawer.querySelectorAll( '[data-cart-close]' ) : [];
	var lastFocused = null;

	function openDrawer() {
		if ( ! drawer ) return;
		lastFocused = document.activeElement;
		drawer.hidden = false;
		requestAnimationFrame( function () {
			drawer.classList.add( 'is-open' );
		} );
		document.body.style.overflow = 'hidden';
		var closeBtn = drawer.querySelector( '.mini-cart-drawer__close' );
		if ( closeBtn ) closeBtn.focus();
	}

	function closeDrawer() {
		if ( ! drawer ) return;
		drawer.classList.remove( 'is-open' );
		document.body.style.overflow = '';
		window.setTimeout( function () {
			drawer.hidden = true;
			if ( lastFocused ) lastFocused.focus();
		}, prefersReducedMotion ? 0 : 320 );
	}

	openTriggers.forEach( function ( el ) {
		el.addEventListener( 'click', openDrawer );
	} );
	closeTriggers.forEach( function ( el ) {
		el.addEventListener( 'click', closeDrawer );
	} );
	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' ) {
			closeDrawer();
			closeFilters();
		}
	} );

	// Native WooCommerce AJAX add-to-cart already updates fragments; we just
	// open the drawer once that's done so shoppers see what was added.
	document.body.addEventListener( 'added_to_cart', function () {
		openDrawer();
	} );

	/* ---------------------------------------------------------------------
	 * Scroll reveal (IntersectionObserver — transform/opacity only)
	 * ------------------------------------------------------------------- */
	if ( 'IntersectionObserver' in window && ! prefersReducedMotion ) {
		var revealTargets = document.querySelectorAll( '[data-reveal], [data-reveal-stagger]' );
		var observer = new IntersectionObserver(
			function ( entries, obs ) {
				entries.forEach( function ( entry ) {
					if ( entry.isIntersecting ) {
						entry.target.classList.add( 'is-visible' );
						obs.unobserve( entry.target );
					}
				} );
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
		);
		revealTargets.forEach( function ( el ) {
			observer.observe( el );
		} );
	} else {
		document.querySelectorAll( '[data-reveal], [data-reveal-stagger]' ).forEach( function ( el ) {
			el.classList.add( 'is-visible' );
		} );
	}

	/* ---------------------------------------------------------------------
	 * Lightweight toast helper (used for form/network feedback)
	 * ------------------------------------------------------------------- */
	function ensureToastContainer() {
		var container = document.querySelector( '.toast-container' );
		if ( ! container ) {
			container = document.createElement( 'div' );
			container.className = 'toast-container';
			container.setAttribute( 'aria-live', 'polite' );
			document.body.appendChild( container );
		}
		return container;
	}

	window.elenToast = function ( message ) {
		var container = ensureToastContainer();
		var toast = document.createElement( 'div' );
		toast.className = 'toast';
		toast.textContent = message;
		container.appendChild( toast );
		requestAnimationFrame( function () {
			toast.classList.add( 'is-visible' );
		} );
		window.setTimeout( function () {
			toast.classList.remove( 'is-visible' );
			window.setTimeout( function () {
				toast.remove();
			}, 320 );
		}, 4000 );
	};

	document.body.addEventListener( 'wc_fragments_ajax_error', function () {
		if ( window.ELEN && window.ELEN.i18n ) {
			window.elenToast( window.ELEN.i18n.error );
		}
	} );
} )();

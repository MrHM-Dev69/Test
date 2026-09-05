<?php
/**
 * Core theme setup: supports, menus, image sizes, widget areas.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Theme_Setup {

	public static function init() {
		add_action( 'after_setup_theme', array( __CLASS__, 'setup' ) );
		add_action( 'widgets_init', array( __CLASS__, 'widgets_init' ) );
		add_filter( 'body_class', array( __CLASS__, 'body_classes' ) );
		add_action( 'wp_head', array( __CLASS__, 'pingback_header' ) );
		add_filter( 'excerpt_length', array( __CLASS__, 'excerpt_length' ) );
		add_filter( 'excerpt_more', array( __CLASS__, 'excerpt_more' ) );
	}

	public static function setup() {
		load_theme_textdomain( 'elen-coffee', ELEN_THEME_DIR . '/languages' );

		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
		add_theme_support( 'customize-selective-refresh-widgets' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'align-wide' );
		add_theme_support( 'wp-block-styles' );

		/**
		 * WooCommerce support. `wc-product-gallery-*` enables the native
		 * zoom/lightbox/slider so we don't need a custom JS gallery plugin.
		 */
		add_theme_support( 'woocommerce' );
		add_theme_support( 'wc-product-gallery-zoom' );
		add_theme_support( 'wc-product-gallery-lightbox' );
		add_theme_support( 'wc-product-gallery-slider' );

		add_image_size( 'elen-product-card', 800, 1000, true );
		add_image_size( 'elen-product-zoom', 1600, 2000, true );
		add_image_size( 'elen-hero', 1920, 1080, true );
		add_image_size( 'elen-editorial', 1200, 1500, true );

		register_nav_menus(
			array(
				'primary' => __( 'Primary Menu', 'elen-coffee' ),
				'footer'  => __( 'Footer Menu', 'elen-coffee' ),
				'legal'   => __( 'Legal Menu', 'elen-coffee' ),
			)
		);

		remove_theme_support( 'core-block-patterns' );
	}

	public static function widgets_init() {
		register_sidebar(
			array(
				'name'          => __( 'Footer Column 1', 'elen-coffee' ),
				'id'            => 'footer-1',
				'before_widget' => '<div class="footer-widget">',
				'after_widget'  => '</div>',
				'before_title'  => '<h3 class="footer-widget__title">',
				'after_title'   => '</h3>',
			)
		);

		/**
		 * Populate with native WooCommerce widgets — "Filter Products by
		 * Attribute" (Roast / Grind / Origin) and "Filter Products by Price"
		 * — from Appearance → Widgets. Kept as a widget area rather than a
		 * hardcoded filter set so an admin can add/remove/reorder facets
		 * without touching code.
		 */
		register_sidebar(
			array(
				'name'          => __( 'Shop Filters', 'elen-coffee' ),
				'id'            => 'shop-filters',
				'description'   => __( 'Native WooCommerce filter widgets (attribute/price). Shown on the shop page as a filter panel.', 'elen-coffee' ),
				'before_widget' => '<div class="shop-filter-widget">',
				'after_widget'  => '</div>',
				'before_title'  => '<h3 class="shop-filter-widget__title">',
				'after_title'   => '</h3>',
			)
		);
	}

	public static function body_classes( $classes ) {
		if ( is_rtl() ) {
			$classes[] = 'is-rtl';
		}
		if ( function_exists( 'is_woocommerce' ) && ( is_woocommerce() || is_cart() || is_checkout() || is_account_page() ) ) {
			$classes[] = 'elen-shop-context';
		}
		return $classes;
	}

	public static function pingback_header() {
		if ( is_singular() && pings_open() ) {
			printf( '<link rel="pingback" href="%s">' . "\n", esc_url( get_bloginfo( 'pingback_url' ) ) );
		}
	}

	public static function excerpt_length( $length ) {
		return 30;
	}

	public static function excerpt_more( $more ) {
		return '&hellip;';
	}
}

ELEN_Theme_Setup::init();

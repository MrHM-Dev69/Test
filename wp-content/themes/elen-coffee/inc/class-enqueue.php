<?php
/**
 * Asset loading. Kept deliberately small: six CSS files (loaded in
 * cascade order, no specificity wars) and one JS entry point, no bundler
 * required. Cache-busting uses filemtime() so a deploy invalidates caches
 * automatically without a manual version bump.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_Enqueue {

	public static function init() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'styles' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'scripts' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'dequeue_woocommerce_defaults' ), 20 );
		add_action( 'wp_head', array( __CLASS__, 'preload_fonts' ), 1 );
		add_filter( 'script_loader_tag', array( __CLASS__, 'defer_scripts' ), 10, 2 );
	}

	private static function ver( $relative_path ) {
		$file = ELEN_THEME_DIR . $relative_path;
		return file_exists( $file ) ? filemtime( $file ) : ELEN_THEME_VERSION;
	}

	public static function styles() {
		$css = array(
			'elen-tokens'     => '/assets/css/tokens.css',
			'elen-base'       => '/assets/css/base.css',
			'elen-components' => '/assets/css/components.css',
			'elen-layout'     => '/assets/css/layout.css',
			'elen-woocommerce'=> '/assets/css/woocommerce.css',
			'elen-utilities'  => '/assets/css/utilities.css',
		);

		$deps = array();
		foreach ( $css as $handle => $path ) {
			wp_enqueue_style( $handle, ELEN_THEME_URI . $path, $deps, self::ver( $path ) );
			$deps[] = $handle;
		}

		if ( is_rtl() ) {
			wp_enqueue_style( 'elen-rtl', ELEN_THEME_URI . '/assets/css/rtl.css', array( 'elen-utilities' ), self::ver( '/assets/css/rtl.css' ) );
		}
	}

	public static function scripts() {
		wp_enqueue_script( 'elen-main', ELEN_THEME_URI . '/assets/js/main.js', array(), self::ver( '/assets/js/main.js' ), true );

		wp_localize_script(
			'elen-main',
			'ELEN',
			array(
				'i18n' => array(
					'error' => __( 'Something went wrong. Please try again.', 'elen-coffee' ),
				),
			)
		);

		if ( function_exists( 'is_product' ) && is_product() ) {
			wp_enqueue_script( 'wc-add-to-cart-variation' );
		}
	}

	/**
	 * WooCommerce ships generic layout/gallery CSS meant for themes with no
	 * design system of their own. We keep the functional (non-visual)
	 * scripts (add-to-cart, cart-fragments) and drop the stylesheet.
	 */
	public static function dequeue_woocommerce_defaults() {
		wp_dequeue_style( 'woocommerce-general' );
		wp_dequeue_style( 'woocommerce-layout' );
		wp_dequeue_style( 'woocommerce-smallscreen' );
	}

	/**
	 * Self-hosted, subset, WOFF2-only variable font. Preloading the single
	 * regular weight avoids a render-blocking @font-face round trip and
	 * keeps CLS near zero; font-display: swap in tokens.css covers the gap.
	 */
	public static function preload_fonts() {
		$font = ELEN_THEME_URI . '/assets/fonts/elen-sans-variable.woff2';
		printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( $font ) );
	}

	public static function defer_scripts( $tag, $handle ) {
		$defer_handles = array( 'elen-main' );
		if ( in_array( $handle, $defer_handles, true ) ) {
			return str_replace( ' src', ' defer src', $tag );
		}
		return $tag;
	}
}

ELEN_Enqueue::init();

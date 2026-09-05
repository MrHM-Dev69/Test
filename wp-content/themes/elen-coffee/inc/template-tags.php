<?php
/**
 * Small template helpers shared across template files.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Minimal inline SVG icon set (no icon font/library — a handful of paths
 * inlined avoids an extra HTTP request and an unstyled-icon flash).
 */
function elen_icon( $name ) {
	$icons = array(
		'bag'    => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
		'user'   => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/></svg>',
		'search' => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></svg>',
		'close'  => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
		'arrow'  => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
	);

	return isset( $icons[ $name ] ) ? $icons[ $name ] : '';
}

function elen_header_fallback_menu() {
	echo '<ul class="site-nav__list">';
	echo '<li><a href="' . esc_url( function_exists( 'wc_get_page_id' ) ? get_permalink( wc_get_page_id( 'shop' ) ) : home_url( '/' ) ) . '">' . esc_html__( 'Shop', 'elen-coffee' ) . '</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/about/' ) ) . '">' . esc_html__( 'About', 'elen-coffee' ) . '</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/contact/' ) ) . '">' . esc_html__( 'Contact', 'elen-coffee' ) . '</a></li>';
	echo '</ul>';
}

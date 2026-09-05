<?php
/**
 * ELEN Coffee theme bootstrap.
 *
 * Loads modular includes. Business logic that must survive a theme switch
 * (payments, SMS notifications) lives in mu-plugins, not here — only
 * presentation, WooCommerce template glue, and SEO/security concerns
 * that are genuinely theme-scoped belong in this theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ELEN_THEME_VERSION', '1.0.0' );
define( 'ELEN_THEME_DIR', get_template_directory() );
define( 'ELEN_THEME_URI', get_template_directory_uri() );

$elen_includes = array(
	'inc/template-tags.php',
	'inc/class-theme-setup.php',
	'inc/class-enqueue.php',
	'inc/class-woocommerce.php',
	'inc/class-security.php',
	'inc/class-seo.php',
	'inc/class-schema.php',
	'inc/class-contact-form.php',
	'inc/class-cart-drawer.php',
	'inc/class-customizer.php',
	'inc/wp-cli-seed-products.php',
);

foreach ( $elen_includes as $elen_file ) {
	$path = ELEN_THEME_DIR . '/' . $elen_file;
	if ( is_readable( $path ) ) {
		require_once $path;
	}
}

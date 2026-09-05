<?php
/**
 * Plugin Name: ELEN Coffee — Payment Gateways
 * Description: Direct-integration WooCommerce payment gateways for Iranian
 *              providers (ZarinPal, Zibal). Lives in mu-plugins (not the
 *              theme) because payment logic must survive a theme switch.
 * Author: ELEN Coffee
 *
 * Design notes:
 * - No third-party payment plugin is used: both gateways are a few dozen
 *   lines against a documented REST API each, so a plugin dependency (with
 *   its own update/security surface) buys nothing here.
 * - Credentials (merchant ID / API key) are stored as WooCommerce gateway
 *   settings (wp_options, admin-only) and are NEVER echoed to the page —
 *   only the redirect URL the gateway itself returns is sent to the browser.
 * - Idempotency: the callback checks the order's current status and a
 *   dedicated "verified" meta flag before calling payment_complete(), so a
 *   duplicated or replayed callback cannot double-credit an order.
 * - process_payment() and the callback both wrap remote calls in try/catch
 *   equivalents (is_wp_error / status checks) — a gateway outage fails the
 *   order into "on-hold" with a clear customer message, never a silent 500.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'plugins_loaded', 'elen_payments_bootstrap', 20 );

function elen_payments_bootstrap() {
	if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
		return; // WooCommerce not active.
	}

	require_once __DIR__ . '/inc/class-elen-gateway-base.php';
	require_once __DIR__ . '/inc/class-elen-gateway-zarinpal.php';
	require_once __DIR__ . '/inc/class-elen-gateway-zibal.php';

	add_filter( 'woocommerce_payment_gateways', function ( $gateways ) {
		$gateways[] = 'ELEN_Gateway_ZarinPal';
		$gateways[] = 'ELEN_Gateway_Zibal';
		return $gateways;
	} );
}

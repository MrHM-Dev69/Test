<?php
/**
 * Plugin Name: ELEN Coffee — SMS Notifications
 * Description: Abstracted SMS provider layer + WooCommerce order-event
 *              notifications. Swapping providers means writing one small
 *              class, not touching the order-status hooks below.
 * Author: ELEN Coffee
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/inc/interface-elen-sms-provider.php';
require_once __DIR__ . '/inc/class-elen-sms-provider-kavenegar.php';
require_once __DIR__ . '/inc/class-elen-sms-provider-melipayamak.php';
require_once __DIR__ . '/inc/class-elen-sms-manager.php';

add_action( 'woocommerce_checkout_order_processed', array( 'ELEN_SMS_Manager', 'on_order_created' ), 10, 1 );
add_action( 'woocommerce_order_status_changed', array( 'ELEN_SMS_Manager', 'on_status_changed' ), 10, 4 );

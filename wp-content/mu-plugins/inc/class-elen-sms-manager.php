<?php
/**
 * Dispatches SMS for the order lifecycle events the spec calls out:
 * created, payment successful/failed, processing, shipped, completed.
 * The active provider is a single switch — everything else in this file
 * is provider-agnostic.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_SMS_Manager {

	public static function provider() {
		$choice = defined( 'ELEN_SMS_PROVIDER' ) ? ELEN_SMS_PROVIDER : get_option( 'elen_sms_provider', 'kavenegar' );

		switch ( $choice ) {
			case 'melipayamak':
				return new ELEN_SMS_Provider_Melipayamak();
			case 'kavenegar':
			default:
				return new ELEN_SMS_Provider_Kavenegar();
		}
	}

	private static function send_to_order( WC_Order $order, $message ) {
		$phone = $order->get_billing_phone();
		if ( ! $phone ) {
			return;
		}

		$result = self::provider()->send( $phone, $message );

		if ( is_wp_error( $result ) ) {
			$order->add_order_note(
				sprintf( 'SMS notification failed: %s', $result->get_error_message() )
			);
		}
	}

	public static function on_order_created( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		self::send_to_order(
			$order,
			sprintf(
				/* translators: 1: site name, 2: order number */
				__( '%1$s: Your order #%2$s has been received. We\'ll notify you once it ships.', 'elen-coffee' ),
				get_bloginfo( 'name' ),
				$order->get_order_number()
			)
		);
	}

	public static function on_status_changed( $order_id, $old_status, $new_status, $order ) {
		if ( ! $order instanceof WC_Order ) {
			$order = wc_get_order( $order_id );
		}
		if ( ! $order ) {
			return;
		}

		$messages = array(
			'processing' => __( 'Payment received — your order is now being prepared.', 'elen-coffee' ),
			'completed'  => __( 'Your order is complete. Thank you for choosing us.', 'elen-coffee' ),
			'failed'     => __( 'Your payment could not be completed. Please try again or contact support.', 'elen-coffee' ),
			'cancelled'  => __( 'Your order has been cancelled.', 'elen-coffee' ),
			'on-hold'    => __( 'Your order is on hold — we\'ll update you shortly.', 'elen-coffee' ),
		);

		if ( ! isset( $messages[ $new_status ] ) ) {
			return;
		}

		self::send_to_order(
			$order,
			sprintf(
				/* translators: 1: site name, 2: order number, 3: status message */
				'%1$s: #%2$s — %3$s',
				get_bloginfo( 'name' ),
				$order->get_order_number(),
				$messages[ $new_status ]
			)
		);
	}

	/**
	 * Call from a custom shipping-fulfilment action/plugin when a tracking
	 * number is attached — WooCommerce core has no "shipped" status by
	 * default (only via extensions like WooCommerce Shipment Tracking), so
	 * this is exposed as a manual entry point rather than assumed.
	 */
	public static function on_shipped( WC_Order $order, $tracking_number = '' ) {
		$message = $tracking_number
			? sprintf( __( 'Your order has shipped. Tracking: %s', 'elen-coffee' ), $tracking_number )
			: __( 'Your order has shipped.', 'elen-coffee' );

		self::send_to_order( $order, sprintf( '%s: %s', get_bloginfo( 'name' ), $message ) );
	}
}

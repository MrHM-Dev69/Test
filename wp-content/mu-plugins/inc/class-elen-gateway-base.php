<?php
/**
 * Shared behaviour for ELEN's direct-integration Iranian payment gateways.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

abstract class ELEN_Gateway_Base extends WC_Payment_Gateway {

	/** @var string WooCommerce order meta key storing the gateway's transaction/authority id. */
	const META_TXN_ID = '_elen_gateway_txn_id';

	/** @var string Meta flag preventing a callback from being processed twice (idempotency). */
	const META_VERIFIED = '_elen_gateway_verified';

	public function __construct() {
		$this->has_fields = false;
		$this->supports   = array( 'products' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
		$this->enabled     = $this->get_option( 'enabled' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_api_' . strtolower( $this->id ), array( $this, 'handle_callback' ) );
	}

	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'     => array(
				'title'   => __( 'Enable/Disable', 'elen-coffee' ),
				'type'    => 'checkbox',
				'label'   => sprintf( __( 'Enable %s', 'elen-coffee' ), $this->method_title ),
				'default' => 'no',
			),
			'title'       => array(
				'title'       => __( 'Title', 'elen-coffee' ),
				'type'        => 'text',
				'description' => __( 'Payment method title the customer sees at checkout.', 'elen-coffee' ),
				'default'     => $this->method_title,
				'desc_tip'    => true,
			),
			'description' => array(
				'title'   => __( 'Description', 'elen-coffee' ),
				'type'    => 'textarea',
				'default' => __( 'Pay securely via ' . $this->method_title, 'elen-coffee' ),
			),
			'merchant_id' => array(
				'title'       => __( 'Merchant ID / API Key', 'elen-coffee' ),
				'type'        => 'password',
				'description' => __( 'Provided by the payment provider. Never exposed to the storefront.', 'elen-coffee' ),
				'desc_tip'    => true,
			),
			'sandbox'     => array(
				'title'   => __( 'Sandbox Mode', 'elen-coffee' ),
				'type'    => 'checkbox',
				'label'   => __( 'Use the provider\'s test/sandbox endpoint', 'elen-coffee' ),
				'default' => 'yes',
			),
		);
	}

	protected function merchant_id() {
		return $this->get_option( 'merchant_id' );
	}

	protected function is_sandbox() {
		return 'yes' === $this->get_option( 'sandbox' );
	}

	protected function callback_url() {
		return WC()->api_request_url( strtolower( $this->id ) );
	}

	/**
	 * Subclasses implement the provider-specific "request payment" call and
	 * must return either a redirect URL (string) or a WP_Error.
	 */
	abstract protected function request_payment( WC_Order $order );

	/**
	 * Subclasses implement the provider-specific "verify payment" call for
	 * the return callback and must return true|WP_Error.
	 */
	abstract protected function verify_payment( WC_Order $order );

	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			wc_add_notice( __( 'Order not found.', 'elen-coffee' ), 'error' );
			return array( 'result' => 'failure' );
		}

		$redirect = $this->request_payment( $order );

		if ( is_wp_error( $redirect ) ) {
			$order->update_status( 'failed', $redirect->get_error_message() );
			wc_add_notice( __( 'Could not connect to the payment gateway. Please try again.', 'elen-coffee' ), 'error' );
			return array( 'result' => 'failure' );
		}

		$order->update_status( 'pending', __( 'Awaiting payment gateway confirmation.', 'elen-coffee' ) );

		return array(
			'result'   => 'success',
			'redirect' => $redirect,
		);
	}

	/**
	 * Handles the provider's return-to-site callback. Idempotent: a second
	 * (duplicate/replayed) call for an already-verified order is a no-op
	 * that just redirects to the order-received page again.
	 */
	public function handle_callback() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- gateway redirect params, verified against the order + provider API below, not a WP nonce.
		$order_id = isset( $_GET['order_id'] ) ? absint( $_GET['order_id'] ) : 0;
		$order    = $order_id ? wc_get_order( $order_id ) : false;

		if ( ! $order ) {
			wp_die( esc_html__( 'Invalid payment callback.', 'elen-coffee' ), '', array( 'response' => 400 ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$provider_status = isset( $_GET['Status'] ) ? sanitize_text_field( wp_unslash( $_GET['Status'] ) ) : ( isset( $_GET['success'] ) ? sanitize_text_field( wp_unslash( $_GET['success'] ) ) : '' );

		if ( $order->get_meta( self::META_VERIFIED ) ) {
			// Already processed — idempotent short-circuit, avoids double-crediting.
			wp_safe_redirect( $this->get_return_url( $order ) );
			exit;
		}

		$explicit_cancel = in_array( strtolower( (string) $provider_status ), array( 'nok', '0', 'false' ), true );
		if ( $explicit_cancel ) {
			$order->update_status( 'cancelled', __( 'Customer cancelled payment at the gateway.', 'elen-coffee' ) );
			wp_safe_redirect( wc_get_cart_url() );
			exit;
		}

		$result = $this->verify_payment( $order );

		if ( is_wp_error( $result ) ) {
			$order->update_status( 'failed', $result->get_error_message() );
			wc_add_notice( __( 'Payment verification failed. If an amount was deducted, it will be refunded automatically by the provider.', 'elen-coffee' ), 'error' );
			wp_safe_redirect( wc_get_checkout_url() );
			exit;
		}

		$order->update_meta_data( self::META_VERIFIED, 1 );
		$order->save();
		$order->payment_complete( $order->get_meta( self::META_TXN_ID ) );

		wp_safe_redirect( $this->get_return_url( $order ) );
		exit;
	}
}

<?php
/**
 * WooCommerce integration. Philosophy: use native WooCommerce data models
 * (global attributes for filterable facets, WooCommerce's own weight field,
 * native AJAX add-to-cart, native cart fragments) and only add the thin
 * custom layer that WooCommerce doesn't already provide — coffee-specific
 * meta (flavor notes, brewing method) and the premium markup/behaviour.
 *
 * No template files are overridden for cart/checkout structure (update-safe);
 * only content-level hooks and CSS carry the design system there. Product
 * archive and single templates ARE overridden because WooCommerce's own
 * hook system doesn't get us premium editorial layouts without it — those
 * overrides mirror the plugin's own template paths/versions so WooCommerce
 * will warn in system status if a future core update changes them.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class ELEN_WooCommerce {

	const ATTRIBUTES = array(
		'roast'  => array( 'label' => 'Roast', 'terms' => array( 'Light', 'Medium', 'Medium-Dark', 'Dark' ) ),
		'grind'  => array( 'label' => 'Grind', 'terms' => array( 'Whole Bean', 'Espresso', 'Filter', 'French Press', 'Turkish' ) ),
		'origin' => array( 'label' => 'Origin', 'terms' => array( 'Ethiopia', 'Colombia', 'Brazil', 'Guatemala', 'Kenya', 'Yemen' ) ),
	);

	public static function init() {
		add_action( 'after_switch_theme', array( __CLASS__, 'register_attributes' ) );
		add_action( 'admin_init', array( __CLASS__, 'maybe_register_attributes' ) );

		add_theme_support( 'wc-product-gallery-zoom' );

		// Structure & spacing hooks — remove noisy defaults, keep semantics.
		remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
		remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
		add_action( 'woocommerce_before_main_content', array( __CLASS__, 'content_wrapper_start' ), 10 );
		add_action( 'woocommerce_after_main_content', array( __CLASS__, 'content_wrapper_end' ), 10 );

		remove_action( 'woocommerce_before_shop_loop', 'woocommerce_result_count', 20 );
		remove_action( 'woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30 );
		add_action( 'woocommerce_before_shop_loop', array( __CLASS__, 'shop_toolbar' ), 20 );

		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );

		add_action( 'woocommerce_single_product_summary', array( __CLASS__, 'coffee_facts_grid' ), 6 );
		add_filter( 'woocommerce_product_tabs', array( __CLASS__, 'custom_product_tabs' ) );

		add_filter( 'loop_shop_per_page', array( __CLASS__, 'products_per_page' ) );
		add_filter( 'woocommerce_products_will_display_get_view_more_link', '__return_false' );

		// Product card composition (kept native via content-product.php override).
		add_action( 'woocommerce_before_shop_loop_item_title', array( __CLASS__, 'card_badges' ), 5 );

		// Cart / mini-cart drawer support.
		add_filter( 'woocommerce_add_to_cart_fragments', array( __CLASS__, 'cart_fragments' ) );

		// Checkout: trim to what's actually needed, don't override markup.
		add_filter( 'woocommerce_checkout_fields', array( __CLASS__, 'slim_checkout_fields' ) );
		add_filter( 'woocommerce_enable_order_notes_field', '__return_false' );

		// Coffee meta box (flavor notes / brewing method).
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_coffee_meta_box' ) );
		add_action( 'save_post_product', array( __CLASS__, 'save_coffee_meta_box' ) );

		// Empty states.
		add_action( 'woocommerce_no_products_found', array( __CLASS__, 'empty_shop_state' ) );
		add_filter( 'wc_empty_cart_message', array( __CLASS__, 'empty_cart_state' ) );
		add_filter( 'woocommerce_shipping_not_available_html', array( __CLASS__, 'shipping_unavailable_state' ) );
	}

	public static function empty_cart_state() {
		ob_start();
		?>
		<div class="empty-state">
			<p class="empty-state__title"><?php esc_html_e( 'Your cart is empty.', 'elen-coffee' ); ?></p>
			<p class="empty-state__text"><?php esc_html_e( "Looks like you haven't added any coffee yet.", 'elen-coffee' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>"><?php esc_html_e( 'Start shopping', 'elen-coffee' ); ?></a>
		</div>
		<?php
		return ob_get_clean();
	}

	public static function shipping_unavailable_state( $html ) {
		return '<div class="alert alert--error">' . esc_html__( "We currently don't ship to this address. Please try a different address or contact us.", 'elen-coffee' ) . '</div>';
	}

	public static function register_attributes() {
		self::maybe_register_attributes();
	}

	public static function maybe_register_attributes() {
		if ( ! class_exists( 'WooCommerce' ) || ! function_exists( 'wc_create_attribute' ) ) {
			return;
		}
		if ( get_option( 'elen_attributes_registered' ) ) {
			return;
		}

		foreach ( self::ATTRIBUTES as $slug => $data ) {
			$taxonomy = wc_attribute_taxonomy_name( $slug );
			if ( ! taxonomy_exists( $taxonomy ) ) {
				wc_create_attribute(
					array(
						'name'         => $data['label'],
						'slug'         => $slug,
						'type'         => 'select',
						'order_by'     => 'menu_order',
						'has_archives' => false,
					)
				);
			}
		}

		delete_transient( 'wc_attribute_taxonomies' );

		foreach ( self::ATTRIBUTES as $slug => $data ) {
			$taxonomy = wc_attribute_taxonomy_name( $slug );
			if ( ! taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			foreach ( $data['terms'] as $term ) {
				if ( ! term_exists( $term, $taxonomy ) ) {
					wp_insert_term( $term, $taxonomy );
				}
			}
		}

		update_option( 'elen_attributes_registered', 1 );
	}

	public static function content_wrapper_start() {
		echo '<main id="primary" class="site-main shop-main">';
	}

	public static function content_wrapper_end() {
		echo '</main>';
	}

	public static function shop_toolbar() {
		echo '<div class="shop-toolbar">';
		echo '<button type="button" class="shop-toolbar__filter-toggle" aria-controls="shop-filters" aria-expanded="false">' . esc_html__( 'Filter', 'elen-coffee' ) . '</button>';
		echo '<div class="shop-toolbar__count">';
		woocommerce_result_count();
		echo '</div>';
		echo '<div class="shop-toolbar__sort">';
		woocommerce_catalog_ordering();
		echo '</div>';
		echo '</div>';
	}

	public static function products_per_page() {
		return 12;
	}

	public static function coffee_facts_grid() {
		global $product;
		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$facts = array(
			__( 'Roast', 'elen-coffee' )   => self::product_attribute_value( $product, 'roast' ),
			__( 'Origin', 'elen-coffee' )  => self::product_attribute_value( $product, 'origin' ),
			__( 'Grind', 'elen-coffee' )   => self::product_attribute_value( $product, 'grind' ),
			__( 'Weight', 'elen-coffee' )  => $product->get_weight() ? $product->get_weight() . get_option( 'woocommerce_weight_unit' ) : '',
			__( 'Flavor Notes', 'elen-coffee' )    => get_post_meta( $product->get_id(), '_elen_flavor_notes', true ),
			__( 'Brewing Method', 'elen-coffee' )  => get_post_meta( $product->get_id(), '_elen_brewing_method', true ),
		);

		$facts = array_filter( $facts );
		if ( empty( $facts ) ) {
			return;
		}

		echo '<dl class="coffee-facts" aria-label="' . esc_attr__( 'Coffee details', 'elen-coffee' ) . '">';
		foreach ( $facts as $label => $value ) {
			echo '<div class="coffee-facts__item"><dt>' . esc_html( $label ) . '</dt><dd>' . esc_html( $value ) . '</dd></div>';
		}
		echo '</dl>';
	}

	private static function product_attribute_value( $product, $slug ) {
		$taxonomy = wc_attribute_taxonomy_name( $slug );
		$terms    = get_the_terms( $product->get_id(), $taxonomy );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return '';
		}
		return implode( ', ', wp_list_pluck( $terms, 'name' ) );
	}

	public static function custom_product_tabs( $tabs ) {
		global $product;

		if ( $product instanceof WC_Product ) {
			$brewing = get_post_meta( $product->get_id(), '_elen_brewing_method', true );
			if ( $brewing ) {
				$tabs['brewing'] = array(
					'title'    => __( 'How to Brew', 'elen-coffee' ),
					'priority' => 25,
					'callback' => function () use ( $brewing ) {
						echo '<div class="brewing-guide">' . wp_kses_post( wpautop( $brewing ) ) . '</div>';
					},
				);
			}
		}

		if ( isset( $tabs['additional_information'] ) ) {
			$tabs['additional_information']['priority'] = 30;
		}

		return $tabs;
	}

	public static function card_badges() {
		global $product;
		if ( ! $product instanceof WC_Product ) {
			return;
		}
		echo '<div class="product-card__badges">';
		if ( $product->is_on_sale() ) {
			echo '<span class="badge badge--sale">' . esc_html__( 'Sale', 'elen-coffee' ) . '</span>';
		}
		if ( ! $product->is_in_stock() ) {
			echo '<span class="badge badge--out">' . esc_html__( 'Out of Stock', 'elen-coffee' ) . '</span>';
		} elseif ( $product->is_on_backorder() ) {
			echo '<span class="badge badge--backorder">' . esc_html__( 'Backorder', 'elen-coffee' ) . '</span>';
		}
		echo '</div>';
	}

	public static function cart_fragments( $fragments ) {
		ob_start();
		?>
		<span class="cart-drawer-trigger__count"><?php echo absint( WC()->cart->get_cart_contents_count() ); ?></span>
		<?php
		$fragments['.cart-drawer-trigger__count'] = ob_get_clean();

		ob_start();
		wc_get_template( 'cart/mini-cart.php' );
		$fragments['div.mini-cart-drawer__body'] = ob_get_clean();

		return $fragments;
	}

	public static function slim_checkout_fields( $fields ) {
		unset( $fields['billing']['billing_company'] );
		unset( $fields['order']['order_comments'] );
		if ( isset( $fields['billing']['billing_address_2'] ) ) {
			$fields['billing']['billing_address_2']['label'] = __( 'Apartment, suite, etc. (optional)', 'elen-coffee' );
		}
		return $fields;
	}

	public static function add_coffee_meta_box() {
		add_meta_box(
			'elen_coffee_details',
			__( 'Coffee Details', 'elen-coffee' ),
			array( __CLASS__, 'render_coffee_meta_box' ),
			'product',
			'normal',
			'high'
		);
	}

	public static function render_coffee_meta_box( $post ) {
		wp_nonce_field( 'elen_coffee_meta_save', 'elen_coffee_meta_nonce' );
		$flavor  = get_post_meta( $post->ID, '_elen_flavor_notes', true );
		$brewing = get_post_meta( $post->ID, '_elen_brewing_method', true );
		?>
		<p>
			<label for="elen_flavor_notes"><strong><?php esc_html_e( 'Flavor Notes', 'elen-coffee' ); ?></strong></label><br>
			<input type="text" id="elen_flavor_notes" name="elen_flavor_notes" class="widefat" value="<?php echo esc_attr( $flavor ); ?>" placeholder="<?php esc_attr_e( 'e.g. Dark chocolate, red berry, caramel', 'elen-coffee' ); ?>">
		</p>
		<p>
			<label for="elen_brewing_method"><strong><?php esc_html_e( 'Brewing Method / Guide', 'elen-coffee' ); ?></strong></label><br>
			<textarea id="elen_brewing_method" name="elen_brewing_method" class="widefat" rows="4" placeholder="<?php esc_attr_e( 'e.g. V60 — 15g coffee, 250ml water at 94°C, 2:30 total brew time', 'elen-coffee' ); ?>"><?php echo esc_textarea( $brewing ); ?></textarea>
		</p>
		<?php
	}

	public static function save_coffee_meta_box( $post_id ) {
		if ( ! isset( $_POST['elen_coffee_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['elen_coffee_meta_nonce'] ) ), 'elen_coffee_meta_save' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_product', $post_id ) ) {
			return;
		}

		if ( isset( $_POST['elen_flavor_notes'] ) ) {
			update_post_meta( $post_id, '_elen_flavor_notes', sanitize_text_field( wp_unslash( $_POST['elen_flavor_notes'] ) ) );
		}
		if ( isset( $_POST['elen_brewing_method'] ) ) {
			update_post_meta( $post_id, '_elen_brewing_method', sanitize_textarea_field( wp_unslash( $_POST['elen_brewing_method'] ) ) );
		}
	}

	public static function empty_shop_state() {
		?>
		<div class="empty-state">
			<p class="empty-state__title"><?php esc_html_e( 'No coffee here — yet.', 'elen-coffee' ); ?></p>
			<p class="empty-state__text"><?php esc_html_e( 'This selection is empty right now. Explore the full collection instead.', 'elen-coffee' ); ?></p>
			<a class="btn btn--primary" href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>"><?php esc_html_e( 'View all coffee', 'elen-coffee' ); ?></a>
		</div>
		<?php
	}
}

ELEN_WooCommerce::init();

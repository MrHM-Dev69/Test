<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="empty-state">
	<p class="empty-state__title"><?php esc_html_e( 'No results found.', 'elen-coffee' ); ?></p>
	<p class="empty-state__text"><?php esc_html_e( 'Try a different search term, or browse the shop directly.', 'elen-coffee' ); ?></p>
	<?php if ( function_exists( 'wc_get_page_id' ) ) : ?>
		<a class="btn btn--primary" href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>"><?php esc_html_e( 'Go to shop', 'elen-coffee' ); ?></a>
	<?php endif; ?>
</div>

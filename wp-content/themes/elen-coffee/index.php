<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<main id="primary" class="site-main container">
	<?php if ( have_posts() ) : ?>
		<div class="post-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'post-card' ); ?> id="post-<?php the_ID(); ?>">
					<?php if ( has_post_thumbnail() ) : ?>
						<a class="post-card__thumb" href="<?php the_permalink(); ?>"><?php the_post_thumbnail( 'elen-editorial' ); ?></a>
					<?php endif; ?>
					<h2 class="post-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="post-card__excerpt"><?php the_excerpt(); ?></div>
				</article>
				<?php
			endwhile;
			?>
		</div>
		<?php the_posts_pagination(); ?>
	<?php else : ?>
		<?php get_template_part( 'template-parts/empty-state', 'search' ); ?>
	<?php endif; ?>
</main>
<?php
get_footer();

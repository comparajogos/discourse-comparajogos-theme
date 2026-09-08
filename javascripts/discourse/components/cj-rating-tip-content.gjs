import { trustHTML } from "@ember/template";
import DButton from "discourse/ui-kit/d-button";
import { i18n } from "discourse-i18n";

const CjRatingTipContent = <template>
  <DButton
    @icon="circle-info"
    @label={{themePrefix "topic_actions.rating_tip"}}
    @action={{@onToggle}}
    aria-expanded={{if @expanded "true" "false"}}
    class="btn-link cj-rating-tip-toggle"
  />
  {{#if @expanded}}
    <div class="tip-details">
      {{trustHTML (i18n @details)}}
    </div>
  {{/if}}
</template>;

export default CjRatingTipContent;

import CjProfileBridge from "../../components/cj-profile-bridge";

export default <template>
  <div id="cj-profile-catalog-details">
    <CjProfileBridge
      @compact={{false}}
      @username={{@outletArgs.model.username}}
      @variant="profile"
    />
  </div>
</template>

import CjProfileBridge from "../../components/cj-profile-bridge";

export default <template>
  <CjProfileBridge
    @compact={{false}}
    @username={{@outletArgs.model.username}}
    @variant="profile"
  />
</template>

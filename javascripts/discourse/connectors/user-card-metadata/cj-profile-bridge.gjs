import CjProfileBridge from "../../components/cj-profile-bridge";

export default <template>
  <CjProfileBridge
    @compact={{true}}
    @username={{@outletArgs.user.username}}
    @variant="card"
  />
</template>
